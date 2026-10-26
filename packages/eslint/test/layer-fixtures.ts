import { typeImportForms } from "./import-forms";
import type { FeodConfig } from "../src/modules/ProjectConfig/index.js";
import { backendLayers, frontendLayers, libraryLayers, cliLayers } from "../src/modules/Layers/index.js";

type LayerCase = { label: string; config: FeodConfig; file: string; code: string; error?: string };

export const layerCases: LayerCase[] = [
  ...Object.entries({ backend: backendLayers, library: libraryLayers }).flatMap(([name, layers]): LayerCase[] => [
    ...Object.keys(layers).map(layer => ({
      label: `${name} ${layer} can use common`, config: { layers },
      file: `src/${layer}/check.ts`, code: "import '@common/utils/math';",
    })),
    { label: `${name} common stays independent`, config: { layers },
      file: "src/common/check.ts", code: "import '@modules/User';", error: "invalidLayerImport" },
    { label: `${name} common forbids barrels`, config: { layers },
      file: "src/common/index.ts", code: "export {};", error: "noCommonIndex" },
    { label: `${name} common limits nesting`, config: { layers },
      file: "src/common/utils/deep/check.ts", code: "export {};", error: "commonTooDeep" },
  ]),
  { label: "cli composition", config: { layers: cliLayers },
    file: "src/app/main.ts", code: "import '@commands/build';" },
  { label: "cli command dependencies", config: { layers: cliLayers },
    file: "src/commands/build.ts", code: "import '@modules/User'; import '@common/utils/math';" },
  { label: "cli commands stay isolated", config: { layers: cliLayers },
    file: "src/commands/build.ts", code: "import '@commands/serve';", error: "pagesImportRestricted" },
  { label: "cli modules cannot import commands", config: { layers: cliLayers },
    file: "src/modules/User/index.ts", code: "import '@commands/build';", error: "pagesImportRestricted" },
  { label: "cli has no pages layer", config: { layers: cliLayers },
    file: "src/pages/build.ts", code: "export {};", error: "unknownFile" },
  { label: "cli app cannot access private command module", config: { layers: cliLayers },
    file: "src/app/main.ts", code: "import '@commands/_build/helper';", error: "privateModuleOutOfScope" },
  { label: "backend composition", config: { rootDefault: { layers: backendLayers }, roots: { server: {} } },
    file: "server/app/api.ts", code: "import '../routes/api'; import '../middlewares/auth';" },
  { label: "backend route isolation", config: { rootDefault: { layers: backendLayers }, roots: { server: {} } },
    file: "server/routes/api.ts", code: "import '../middlewares/auth';", error: "invalidLayerImport" },
  { label: "backend modules stay private", config: { rootDefault: { layers: backendLayers }, roots: { server: {} } },
    file: "server/routes/api.ts", code: "import '../modules/User/private';", error: "invalidModuleImport" },
  { label: "library composition", config: { rootDefault: { layers: libraryLayers }, roots: { core: {} } },
    file: "core/app/api.ts", code: "import '@modules/User';" },
  { label: "custom directions", config: { layers: { source: { imports: ["adapter"] }, adapter: { imports: [] } } },
    file: "src/source/x.ts", code: "import '@adapter/private';" },
  { label: "custom reverse forbidden", config: { layers: { source: { imports: ["adapter"] }, adapter: { imports: [] } } },
    file: "src/adapter/x.ts", code: "import '@source/private';", error: "invalidLayerImport" },
  { label: "custom names do not imply FEOD roles", config: { layers: { common: { imports: ["modules"] }, modules: { imports: [] } } },
    file: "src/common/index.ts", code: "import '@modules/User/private';" },
  { label: "custom module role", config: { layers: { composition: { imports: ["services"], role: "app" }, services: { imports: ["services"], role: "modules" } } },
    file: "src/composition/x.ts", code: "import '@services/User/private';", error: "invalidModuleImport" },
  { label: "extend preset with user layer", config: { layers: { ...frontendLayers,
    app: { ...frontendLayers.app, imports: [...frontendLayers.app.imports, "jobs"] }, jobs: { imports: ["modules", "common"] } } },
    file: "src/app/x.ts", code: "import '@jobs/run';" },
  { label: "role does not hardcode app directions", config: { layers: { ...frontendLayers,
    modules: { ...frontendLayers.modules, imports: ["app"] } } },
    file: "src/modules/User/x.ts", code: "import '@app/setup';" },
  { label: "roots replace inherited layer set", config: { rootDefault: { layers: frontendLayers }, roots: { src: {}, core: { layers: libraryLayers } } },
    file: "core/pages/x.ts", code: "export const x = 1;", error: "unknownFile" },
];

// Both engines exercise the same ownership and configurable access policy.
export const submoduleCases: typeof layerCases = [
  { label: "parent reads child public API", config: {}, file: "src/modules/Parent/index.ts", code: "import './modules/Child';" },
  { label: "parent cannot read child implementation", config: {}, file: "src/modules/Parent/index.ts", code: "import './modules/Child/private';", error: "invalidModuleImport" },
  { label: "child reads parent implementation", config: {}, file: "src/modules/Parent/modules/Child/index.ts", code: "import '../../shared';" },
  { label: "child alias reads parent implementation", config: {}, file: "src/modules/Parent/modules/Child/index.ts", code: "import '@modules/Parent/shared';" },
  { label: "own deep implementation", config: {}, file: "src/modules/Parent/modules/Child/modules/Leaf/index.ts", code: "import './private';" },
  { label: "deep parent reads child public API", config: {}, file: "src/modules/Parent/modules/Child/index.ts", code: "import './modules/Leaf/index';" },
  { label: "deep parent cannot read child implementation", config: {}, file: "src/modules/Parent/modules/Child/index.ts", code: "import './modules/Leaf/private';", error: "invalidModuleImport" },
  { label: "deep child reads immediate parent implementation", config: {}, file: "src/modules/Parent/modules/Child/modules/Leaf/index.ts", code: "import '../../shared';" },
  { label: "child cannot read sibling implementation", config: {}, file: "src/modules/Parent/modules/Child/index.ts", code: "import '../Sibling/private';", error: "invalidModuleImport" },
  { label: "child reads shallow sibling public API", config: {}, file: "src/modules/Parent/modules/Child/index.ts", code: "import '../Sibling';" },
  { label: "deep child cannot bypass grandparent API", config: {}, file: "src/modules/Parent/modules/Child/modules/Leaf/index.ts", code: "import '../../../../shared';", error: "invalidModuleImport" },
  { label: "grandparent cannot reach deep child", config: {}, file: "src/modules/Parent/index.ts", code: "import './modules/Child/modules/Leaf';", error: "noSubmoduleOfSubmodule" },
  { label: "opt in parent implementation access", config: { submodules: { parentImports: "implementation" } }, file: "src/modules/Parent/index.ts", code: "import './modules/Child/private';" },
  { label: "restrict child to parent public API", config: { submodules: { childImportsParent: "public" } }, file: "src/modules/Parent/modules/Child/index.ts", code: "import '../../shared';", error: "invalidModuleImport" },
  { label: "restricted child reads parent public API", config: { submodules: { childImportsParent: "public" } }, file: "src/modules/Parent/modules/Child/index.ts", code: "import '../../index';" },
  { label: "policy inherits and merges fields", config: { rootDefault: { submodules: { parentImports: "implementation", childImportsParent: "public" } }, roots: { server: { submodules: { childImportsParent: "implementation" } } } }, file: "server/modules/Parent/index.ts", code: "import './modules/Child/private';" },
  { label: "custom module directory policy", config: { layers: { features: { dir: "domain", imports: ["features"], role: "modules" } } }, file: "src/domain/Parent/modules/Child/index.ts", code: "import '@features/Parent/shared';" },
];

for (const [name, form] of Object.entries(typeImportForms)) {
  submoduleCases.push(
    { label: `child parent ${name}`, config: {}, file: "src/modules/Parent/modules/Child/index.ts", code: form("../../shared") },
    { label: `parent child ${name}`, config: {}, file: "src/modules/Parent/index.ts", code: form("./modules/Child/private"), error: "invalidModuleImport" },
  );
}

export const computedImportCases: typeof layerCases = [
  ...[
    ["variable import", "void import(target);"],
    ["template expression", "void import(`./${name}.ts`);"],
    ["concatenation", "void import('./' + name);"],
    ["variable require", "require(target);"],
    ["empty require", "require();"],
    ["non-string require", "require(42);"],
    ["computed file URL", "void import(new URL(target, import.meta.url).href);"],
    ["different URL base", "void import(new URL('./x.ts', base).href);"],
    ["shadowed URL", "function load(URL) { return import(new URL('./x.ts', import.meta.url).href); }"],
  ].map(([label, code]) => ({ label, code, file: "src/app/check.ts", config: { imports: { computed: "forbid" as const } }, error: "computedImport" })),
  ...([
    ["default keeps computed imports", "void import(target); require(target);", {}],
    ["explicit ignore", "void import(target);", { imports: { computed: "ignore" } }],
    ["literal dynamic import", "void import('./x.ts');"],
    ["literal require", "require('./x.ts');"],
    ["template literal", "void import(`./x.ts`); require(`./x.ts`);"],
    ["literal file URL", "void import(new URL('./x.ts', import.meta.url).href);"],
    ["URL template literal", "void import(new URL(`./x.ts`, import.meta.url).href);"],
    ["parameter require", "function load(require) { return require(target); }"],
    ["local require", "const require = loader; require(target);"],
    ["imported require", "import require from 'custom-loader'; require(target);"],
    ["member require", "loader.require(target);"],
  ] satisfies [string, string, FeodConfig?][]).map(([label, code, config]) => ({ label, code, file: "src/app/check.ts", config: config ?? { imports: { computed: "forbid" as const } } })),
  { label: "computed check inherits rootDefault", config: { rootDefault: { imports: { computed: "forbid" } }, roots: { src: {}, server: { imports: { computed: "ignore" } } } }, file: "src/app/check.ts", code: "void import(target);", error: "computedImport" },
  { label: "computed check root override", config: { rootDefault: { imports: { computed: "forbid" } }, roots: { src: {}, server: { imports: { computed: "ignore" } } } }, file: "server/app/check.ts", code: "void import(target);" },
  { label: "computed check respects ignore", config: { imports: { computed: "forbid" }, ignore: ["src/app/check.ts"] }, file: "src/app/check.ts", code: "void import(target); require(target);" },
  { label: "static boundary stays enforced", config: { imports: { computed: "forbid" } }, file: "src/app/check.ts", code: "void import('../modules/User/private');", error: "invalidModuleImport" },
  { label: "unresolved missing local forbidden", config: { imports: { unresolved: "forbid" } }, file: "src/app/check.ts", code: "import './missing.js';", error: "unresolvedImport" },
  { label: "unresolved ignores packages", config: { imports: { unresolved: "forbid" } }, file: "src/app/check.ts", code: "import 'lodash';" },
  { label: "unresolved ignores builtins", config: { imports: { unresolved: "forbid" } }, file: "src/app/check.ts", code: "import 'node:fs';" },
];

export const visibilityCases: typeof layerCases = [
  ...[
    ["same owner", "src/modules/Parent/modules/Child/index.ts", "./private"],
    ["parent public child", "src/modules/Parent/index.ts", "./modules/Child"],
    ["child parent implementation", "src/modules/Parent/modules/Child/index.ts", "../../shared"],
    ["deep parent public child", "src/modules/Parent/modules/Child/index.ts", "./modules/Leaf/index.ts"],
    ["deep child parent implementation", "src/modules/Parent/modules/Child/modules/Leaf/index.ts", "../../shared"],
    ["deep own public entry", "src/modules/Parent/modules/Child/modules/Leaf/index.ts", "./index.ts"],
  ].map(([label, file, source]) => ({ label, file, code: `import '${source}';`, config: { submodules: { visibility: "parent-only" as const } } })),
  ...[
    ["sibling public", "src/modules/Parent/modules/Child/index.ts", "../Sibling"],
    ["sibling private", "src/modules/Parent/modules/Child/index.ts", "../Sibling/private"],
    ["outsider public", "src/modules/Other/index.ts", "@modules/Parent/modules/Child"],
    ["app public child", "src/app/check.ts", "@modules/Parent/modules/Child"],
  ].map(([label, file, source]) => ({ label, file, code: `import '${source}';`, config: { submodules: { visibility: "parent-only" as const } }, error: "privateSubmodule" })),
  { label: "parent-only respects parent public restriction", config: { submodules: { visibility: "parent-only" } }, file: "src/modules/Parent/index.ts", code: "import './modules/Child/private';", error: "invalidModuleImport" },
  { label: "parent-only configurable parent implementation", config: { submodules: { visibility: "parent-only", parentImports: "implementation" } }, file: "src/modules/Parent/index.ts", code: "import './modules/Child/private';" },
  { label: "parent-only configurable child public", config: { submodules: { visibility: "parent-only", childImportsParent: "public" } }, file: "src/modules/Parent/modules/Child/index.ts", code: "import '../../shared';", error: "invalidModuleImport" },
  { label: "parent-only deep child public parent", config: { submodules: { visibility: "parent-only", childImportsParent: "public" } }, file: "src/modules/Parent/modules/Child/modules/Leaf/index.ts", code: "import '../../index.ts';" },
  { label: "parent override does not expose unrelated top module to app", config: { submodules: { parentImports: "implementation" } }, file: "src/app/check.ts", code: "import '@modules/Parent/private';", error: "invalidModuleImport" },
  { label: "visibility inherits independently", config: { rootDefault: { submodules: { visibility: "parent-only", parentImports: "implementation" } }, roots: { server: { submodules: { parentImports: "public" } } } }, file: "server/modules/Other/index.ts", code: "import '@modules/Parent/modules/Child';", error: "privateSubmodule" },
  { label: "visibility root override", config: { rootDefault: { submodules: { visibility: "parent-only" } }, roots: { server: { submodules: { visibility: "public" } } } }, file: "server/modules/Other/index.ts", code: "import '@modules/Parent/modules/Child';" },
  { label: "visibility nested FEOD root ownership", config: { rootDefault: { submodules: { visibility: "parent-only" } }, roots: { src: {}, "src/modules/vendor": {} } }, file: "src/modules/vendor/modules/Other/index.ts", code: "import '@modules/Parent/modules/Child';", error: "privateSubmodule" },
  { label: "visibility custom layer", config: { layers: { domain: { dir: "features", imports: ["domain"], role: "modules" } }, submodules: { visibility: "parent-only" } }, file: "src/features/Parent/modules/Child/index.ts", code: "import '@domain/Parent/modules/Sibling';", error: "privateSubmodule" },
  { label: "visibility keeps transit private core", config: { submodules: { visibility: "parent-only" }, transitModules: ["Hub"] }, file: "src/modules/Hub/Child/index.ts", code: "import '../_/shared';" },
  { label: "visibility keeps transit public API", config: { submodules: { visibility: "parent-only" }, transitModules: ["Hub"] }, file: "src/app/check.ts", code: "import '@modules/Hub/Child';" },
  { label: "visibility keeps single file API", config: { submodules: { visibility: "parent-only" }, singleFileModules: true }, file: "src/app/check.ts", code: "import '@modules/Logger.ts';" },
];
for (const [name, form] of Object.entries(typeImportForms)) {
  visibilityCases.push(
    { label: `visibility child parent ${name}`, config: { submodules: { visibility: "parent-only" } }, file: "src/modules/Parent/modules/Child/index.ts", code: form("../../shared") },
    { label: `visibility sibling public ${name}`, config: { submodules: { visibility: "parent-only" } }, file: "src/modules/Parent/modules/Child/index.ts", code: form("../Sibling"), error: "privateSubmodule" },
  );
}
