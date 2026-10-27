import type { FeodConfig } from "../src/modules/ProjectConfig/index.js";
import { frontendLayers } from "../src/modules/Layers/index.js";

type Case = { label: string; config: FeodConfig; file: string; code: string; error?: string };
const file = "src/global/check.ts";
const onlyTypes: FeodConfig = { globals: { localImports: "type-only" } };
const forbid: FeodConfig = { globals: { localImports: "forbid" } };
const typeForms = {
  "type import": "import type { Value } from '@modules/User';",
  "type default": "import type Value from '@modules/User';",
  "type namespace": "import type * as Value from '@modules/User';",
  "inline type import": "import { type Value, type Other } from '@modules/User';",
  "type reexport": "export type { Value } from '@modules/User';",
  "inline type reexport": "export { type Value, type Other } from '@modules/User';",
  "type export all": "export type * from '@modules/User';",
  "type export namespace": "export type * as Value from '@modules/User';",
  "import type expression": "type Value = import('@modules/User').Value;",
  "typeof import expression": "type Value = typeof import('@modules/User');",
  "type import equals": "import type Value = require('@modules/User');",
};
const valueForms = {
  "value import": "import { Value } from '@modules/User';",
  "mixed import": "import { type Value, other } from '@modules/User';",
  "mixed default": "import value, { type Value } from '@modules/User';",
  "side effect": "import '@modules/User';",
  "empty import": "import {} from '@modules/User';",
  "value reexport": "export { Value } from '@modules/User';",
  "mixed reexport": "export { type Value, other } from '@modules/User';",
  "empty reexport": "export {} from '@modules/User';",
  "export all": "export * from '@modules/User';",
  "export namespace": "export * as Value from '@modules/User';",
  dynamic: "void import('@modules/User');",
  template: "void import(`@modules/User`);",
  require: "require('@modules/User');",
  "import equals": "import value = require('@modules/User');",
  "file URL": "void import(new URL('../modules/User/index.ts', import.meta.url).href);",
};
const roots: FeodConfig = {
  rootDefault: { globals: { localImports: "type-only" } },
  roots: { src: { dependencies: ["core"] }, core: {} },
};
export const globalImportCases: Case[] = [
  ...Object.entries(typeForms).flatMap(([label, code]) => [
    { label: `globals allows ${label}`, config: onlyTypes, file, code },
    { label: `globals forbids ${label}`, config: forbid, file, code, error: "invalidGlobalLocalImport" },
  ]),
  ...Object.entries(valueForms).map(([label, code]) => ({
    label: `globals rejects ${label}`,
    config: onlyTypes,
    file,
    code,
    error: "invalidGlobalLocalImport",
  })),
  { label: "globals defaults preserve values", config: {}, file, code: valueForms["value import"] },
  {
    label: "globals declarations do not imply type imports",
    config: onlyTypes,
    file: "src/global/check.d.ts",
    code: valueForms["value import"],
    error: "invalidGlobalLocalImport",
  },
  {
    label: "globals explicit allow preserves values",
    config: { globals: { localImports: "allow" } },
    file,
    code: valueForms["value import"],
  },
  {
    label: "globals policy does not affect app",
    config: forbid,
    file: "src/app/check.ts",
    code: valueForms["value import"],
  },
  {
    label: "globals policy uses role and custom alias",
    config: {
      globals: { localImports: "forbid" },
      layers: {
        ambient: { role: "global", dir: "declarations", imports: ["business"] },
        business: { role: "modules", dir: "features", imports: [] },
      },
      layerAliases: { "#business": "src/features" },
    },
    file: "src/declarations/check.ts",
    code: "import '#business/User';",
    error: "invalidGlobalLocalImport",
  },
  {
    label: "globals checks unknown local target",
    config: forbid,
    file,
    code: "import '../unclassified/types';",
    error: "invalidGlobalLocalImport",
  },
  {
    label: "globals checks file outside configured root",
    config: forbid,
    file,
    code: "import '../../tools/types';",
    error: "invalidGlobalLocalImport",
  },
  {
    label: "globals checks relative file outside project",
    config: forbid,
    file,
    code: "import '../../../outside';",
    error: "invalidGlobalLocalImport",
  },
  {
    label: "globals checks own files",
    config: forbid,
    file,
    code: "import './types';",
    error: "invalidGlobalLocalImport",
  },
  {
    label: "globals permits type from own files",
    config: onlyTypes,
    file,
    code: "import type { Value } from './types';",
  },
  { label: "globals ignores bare external", config: forbid, file, code: "import 'external-package';" },
  { label: "globals ignores builtin", config: forbid, file, code: "import 'node:fs';" },
  {
    label: "globals ignores node_modules target",
    config: forbid,
    file,
    code: "import '../../node_modules/external-package/index.js';",
  },
  {
    label: "globals ignores shadowed require",
    config: forbid,
    file,
    code: "function load(require: (id: string) => void) { require('@modules/User'); }",
  },
  {
    label: "globals type access preserves private boundaries",
    config: onlyTypes,
    file,
    code: "import type { Value } from '@modules/User/private';",
    error: "invalidModuleImport",
  },
  {
    label: "globals type access preserves layer matrix",
    config: { ...onlyTypes, layers: { ...frontendLayers, global: { ...frontendLayers.global, imports: [] } } },
    file,
    code: typeForms["type import"],
    error: "invalidLayerImport",
  },
  {
    label: "globals cross root runtime denied before early return",
    config: roots,
    file,
    code: "import '../../core/modules/User';",
    error: "invalidGlobalLocalImport",
  },
  {
    label: "globals cross root type allowed",
    config: roots,
    file,
    code: "import type { Value } from '../../core/modules/User';",
  },
  {
    label: "globals cross root type respects dependencies",
    config: { ...roots, roots: { src: {}, core: {} } },
    file,
    code: "import type { Value } from '../../core/modules/User';",
    error: "invalidRootImport",
  },
  {
    label: "globals cross root type respects public API",
    config: roots,
    file,
    code: "import type { Value } from '../../core/modules/User/private';",
    error: "crossRootPublicOnly",
  },
  {
    label: "globals cross root forbid rejects types",
    config: { ...roots, rootDefault: { globals: { localImports: "forbid" } } },
    file,
    code: "import type { Value } from '../../core/modules/User';",
    error: "invalidGlobalLocalImport",
  },
  {
    label: "globals root override resets inherited policy",
    config: {
      rootDefault: { globals: { localImports: "forbid" } },
      roots: { server: { globals: { localImports: "allow" } } },
    },
    file: "server/global/check.ts",
    code: valueForms["value import"],
  },
  {
    label: "globals nearest nested root owns policy",
    config: {
      rootDefault: { globals: { localImports: "forbid" } },
      roots: { src: {}, "src/nested": { globals: { localImports: "allow" } } },
    },
    file: "src/nested/global/check.ts",
    code: valueForms["value import"],
  },
  {
    label: "globals empty file list keeps inherited import policy",
    config: {
      rootDefault: { globals: { allowedFiles: ["**/*.d.ts"], localImports: "forbid" } },
      roots: { src: { globals: { allowedFiles: [] } } },
    },
    file,
    code: valueForms["value import"],
    error: "invalidGlobalLocalImport",
  },
  {
    label: "globals honors ignored importer",
    config: { ...forbid, ignore: ["src/global/**"] },
    file,
    code: valueForms["value import"],
  },
  {
    label: "globals honors ignored target",
    config: { ...forbid, ignore: ["src/modules/**"] },
    file,
    code: valueForms["value import"],
  },
];
