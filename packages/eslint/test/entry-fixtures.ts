import type { FeodConfig } from "../src/modules/ProjectConfig/index.js";
import { typeImportForms } from "./import-forms";

const exact: FeodConfig = { modules: { publicEntries: ["index.ts"] } };
export const entryCases: { label: string; config: FeodConfig; file: string; code: string; error?: string }[] = [
  ...["@modules/User", "@modules/User/index.ts"].map(source => ({ label: `exact public ${source}`, config: exact, file: "src/app/check.ts", code: `import '${source}';` })),
  ...["@modules/User/index.internal.ts", "@modules/User/index.js", "@modules/User/index", "@modules/User/index.ts/private"].map(source => ({ label: `exact private ${source}`, config: exact, file: "src/app/check.ts", code: `import '${source}';`, error: "invalidModuleImport" })),
  { label: "root empty reset restores legacy", config: { rootDefault: exact, roots: { server: { modules: { publicEntries: [] } } } }, file: "server/app/check.ts", code: "import '@modules/User/index.js';" },
  { label: "relative transit custom entry agrees across rules", config: { modules: { publicEntries: ["api.ts"] }, transitModules: ["Hub"] }, file: "src/modules/Other/index.ts", code: "import '../Hub/Child/api.ts';" },
  { label: "legacy entries unchanged", config: {}, file: "src/app/check.ts", code: "import '@modules/User/index.internal.ts';" },
  { label: "empty entries restore legacy", config: { modules: { publicEntries: [] } }, file: "src/app/check.ts", code: "import '@modules/User/index.js';" },
  { label: "custom entry allowed", config: { modules: { publicEntries: ["api.ts", "public.mts"] } }, file: "src/modules/Other/index.ts", code: "import '../User/api.ts';" },
  { label: "custom entry closes implicit index", config: { modules: { publicEntries: ["api.ts"] } }, file: "src/app/check.ts", code: "import '@modules/User/index.ts';", error: "invalidModuleImport" },
  { label: "own implementation unaffected", config: exact, file: "src/modules/User/index.ts", code: "import './private';" },
  { label: "parent public child uses exact entry", config: exact, file: "src/modules/User/index.ts", code: "import './modules/Child/index.js';", error: "invalidModuleImport" },
  { label: "child parent implementation unaffected", config: exact, file: "src/modules/User/modules/Child/index.ts", code: "import '../../private';" },
  { label: "single-file unaffected", config: { ...exact, singleFileModules: true }, file: "src/app/check.ts", code: "import '@modules/User.ts';" },
  { label: "transit exact entry allowed", config: { ...exact, transitModules: ["Hub"] }, file: "src/app/check.ts", code: "import '@modules/Hub/Child/index.ts';" },
  { label: "transit exact entry denied", config: { ...exact, transitModules: ["Hub"] }, file: "src/app/check.ts", code: "import '@modules/Hub/Child/index.js';", error: "invalidTransitSubmoduleImport" },
  { label: "root entry override", config: { rootDefault: exact, roots: { src: {}, server: { modules: { publicEntries: ["api.ts"] } } } }, file: "server/app/check.ts", code: "import '@modules/User/api.ts';" },
  { label: "entry merge preserves name policy", config: { rootDefault: { modules: { forbiddenNames: ["utils"], publicEntries: ["index.ts"] } }, roots: { src: { modules: { publicEntries: ["api.ts"] } } } }, file: "src/modules/utils/index.ts", code: "export {};", error: "forbiddenModuleName" },
  { label: "foreign root owns allowed entries", config: { roots: { src: { dependencies: ["core"], modules: { publicEntries: ["index.ts"] } }, core: { modules: { publicEntries: ["api.ts"] } } } }, file: "src/app/check.ts", code: "import '../../core/modules/User/api.ts';" },
  { label: "foreign root rejects source entries", config: { roots: { src: { dependencies: ["core"], modules: { publicEntries: ["index.ts"] } }, core: { modules: { publicEntries: ["api.ts"] } } } }, file: "src/app/check.ts", code: "import '../../core/modules/User/index.ts';", error: "crossRootPublicOnly" },
  { label: "foreign transit owns entries", config: { roots: { src: { dependencies: ["core"] }, core: { modules: { publicEntries: ["api.ts"] }, transitModules: ["Hub"] } } }, file: "src/app/check.ts", code: "import '../../core/modules/Hub/Child/index.ts';", error: "crossRootPublicOnly" },
];
for (const [name, form] of Object.entries({
  ...typeImportForms,
  dynamic: (source: string) => `void import('${source}');`,
  require: (source: string) => `require('${source}');`,
  fileURL: (source: string) => `void import(new URL('${source}', import.meta.url).href);`,
})) {
  entryCases.push(
    { label: `exact allowed ${name}`, config: exact, file: "src/app/check.ts", code: form("../modules/User/index.ts") },
    { label: `exact forbidden ${name}`, config: exact, file: "src/app/check.ts", code: form("../modules/User/index.js"), error: "invalidModuleImport" },
  );
}
