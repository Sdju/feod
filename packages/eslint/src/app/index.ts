import type { Linter, Rule } from "eslint";

import { withRoots } from "../modules/Architecture/index.js";

import { PLUGIN_NAME } from "./constants.js";
import confine from "../rules/confine.js";
import largeFiles from "../rules/large-files.js";
import globalFiles from "../rules/global-files.js";
import moduleNames from "../rules/module-names.js";
import moduleEntries from "../rules/module-entries.js";
import noModuleCycles from "../rules/no-module-cycles.js";
import noFileCycles from "../rules/no-file-cycles.js";
import layerImports from "../rules/layer-imports.js";
import noCommonIndex from "../rules/no-common-index.js";
import noZigzagImports from "../rules/no-zigzag-imports.js";
import noUnknownFiles from "../rules/no-unknown-files.js";
import noCommonDeep from "../rules/no-common-deep.js";
import visibilityLevels from "../rules/visibility-levels.js";
import noSubmoduleOfSubmodule from "../rules/no-submodule-of-submodule.js";
import pagesPrivateModules from "../rules/pages-private-modules.js";
import {
  recommended,
  strict,
  createRuleConfig,
  loadFeodConfig,
  type FeodConfig,
  type ConfigOptions,
} from "../modules/ProjectConfig/index.js";

const rules: Record<string, Rule.RuleModule> = {
  confine: withRoots(confine),
  "large-files": withRoots(largeFiles),
  "global-files": withRoots(globalFiles),
  "module-names": withRoots(moduleNames),
  "module-entries": withRoots(moduleEntries),
  "no-module-cycles": withRoots(noModuleCycles),
  "no-file-cycles": withRoots(noFileCycles),
  "layer-imports": withRoots(layerImports),
  "no-common-index": withRoots(noCommonIndex),
  "no-common-deep": withRoots(noCommonDeep),
  "no-zigzag-imports": withRoots(noZigzagImports),
  "no-unknown-files": withRoots(noUnknownFiles),
  "visibility-levels": withRoots(visibilityLevels),
  "no-submodule-of-submodule": withRoots(noSubmoduleOfSubmodule),
  "pages-private-modules": withRoots(pagesPrivateModules),
};

const configs = {
  recommended,
  strict,
};

const plugin = {
  meta: {
    name: PLUGIN_NAME,
  },
  rules,
  configs,
};

export default plugin;
export { configs, rules };
export { createRuleConfig, loadFeodConfig, FeodConfigError } from "../modules/ProjectConfig/index.js";
export type {
  FeodConfig,
  FeodRootConfig,
  ConfigOptions,
  LoadedFeodConfig,
  NormalizedFeodConfig,
  NormalizedRootConfig,
} from "../modules/ProjectConfig/index.js";

export function createConfig(
  config: FeodConfig = {},
  options: ConfigOptions = {},
): Linter.Config & ReturnType<typeof createRuleConfig> {
  return { plugins: { [PLUGIN_NAME]: plugin }, ...createRuleConfig(config, options) };
}

export function configFromProject(options: ConfigOptions = {}): Linter.Config & ReturnType<typeof createRuleConfig> {
  const loaded = loadFeodConfig(options);
  return createConfig(loaded.config, { ...options, rootDir: loaded.rootDir });
}

export type { SubmodulePolicy } from "../modules/Architecture/index.js";

export type { ImportPolicy } from "../modules/Architecture/index.js";
export {
  resolveImport,
  resolveImportOffline,
  resolveImportPath,
  resolveExistingPath,
  isMissingLocalImport,
} from "../modules/Architecture/index.js";
export type { ResolveResult, ResolveOptions } from "../modules/Architecture/index.js";

export type { LargeFileEntry, LargeFilesPolicy } from "../modules/LargeFiles/index.js";
export { checkLargeFile } from "../modules/LargeFiles/index.js";
export { largeFilesRows, renderLargeFilesMarkdown } from "../modules/LargeFiles/index.js";
export type { LargeFileRow, LargeFilesMarkdownOptions } from "../modules/LargeFiles/index.js";
export type { ConfineEntry, ConfinePolicy } from "../modules/Confine/index.js";
export type {
  CyclesPolicy,
  GlobalFilesPolicy,
  InventoryPolicy,
  ModuleNamesPolicy,
  ModulePolicy,
} from "../modules/Architecture/index.js";
export { buildInventory, getInventory, clearInventoryState } from "../modules/Architecture/index.js";
export type { InventoryModule, InventoryOptions, RootInventory } from "../modules/Architecture/index.js";
export {
  buildModuleGraph,
  buildFileGraph,
  getModuleGraph,
  getFileGraph,
  clearGraphState,
} from "../modules/Architecture/index.js";
export type {
  DependencyRecord,
  FileGraph,
  GraphCycle,
  GraphOptions,
  ModuleCycle,
  ModuleGraph,
} from "../modules/Architecture/index.js";
export { extractStaticDependencies } from "../modules/Architecture/index.js";
export type { ExtractedDependency, DependencyKind } from "../modules/Architecture/index.js";
