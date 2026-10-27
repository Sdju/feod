import path from "node:path";
import type { Linter } from "eslint";
import {
  FeodConfigError,
  normalizeFeodConfig,
  type FeodConfig,
  type LoadOptions,
  type NormalizedRootConfig,
} from "@o-feod/config";

import recommended from "./recommended.js";
import strict from "./strict.js";

export { loadFeodConfig, FeodConfigError } from "@o-feod/config";
export type {
  FeodConfig,
  FeodRootConfig,
  LoadedFeodConfig,
  NormalizedFeodConfig,
  NormalizedRootConfig,
} from "@o-feod/config";

export type ConfigOptions = LoadOptions & { preset?: "recommended" | "strict" };

/** Shared rule configuration; linters add only their own plugin registration. */
export function createRuleConfig(
  config: FeodConfig = {},
  options: ConfigOptions = {},
): { rules: NonNullable<Linter.Config["rules"]> } {
  const input = normalizeFeodConfig(config, "inline config");
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const preset = options.preset ?? "recommended";
  if (preset !== "recommended" && preset !== "strict") throw new FeodConfigError(`unknown preset '${String(preset)}'`);
  const base = preset === "strict" ? strict : recommended;
  const rootRules = Object.fromEntries(
    Object.entries(input.roots).map(([srcRoot, root]) => [srcRoot, optionsForRoot(root, srcRoot, rootDir)]),
  );
  const first = rootRules[Object.keys(input.roots)[0]];
  const rules: NonNullable<Linter.Config["rules"]> = {};
  for (const [name, entry] of Object.entries(base.rules)) {
    const optional =
      name === "feod-structure/large-files" ||
      name === "feod-structure/confine" ||
      name === "feod-structure/global-files" ||
      name === "feod-structure/module-names" ||
      name === "feod-structure/module-entries" ||
      name === "feod-structure/no-module-cycles" ||
      name === "feod-structure/no-file-cycles";
    const enabled =
      optional && Object.values(rootRules).some(options => (options[name] as { enabled: boolean }).enabled);
    const severity = enabled ? "error" : Array.isArray(entry) ? entry[0] : entry;
    rules[name] =
      severity === "off"
        ? "off"
        : [
            severity,
            {
              ...first[name],
              roots: Object.fromEntries(Object.entries(rootRules).map(([root, options]) => [root, options[name]])),
            },
          ];
  }
  return { rules };
}

function optionsForRoot(input: NormalizedRootConfig, srcRoot: string, rootDir: string): Record<string, object> {
  const common = { rootDir, srcRoot, ignore: input.ignore };
  const resolver = { aliasPrefix: input.aliasPrefix, aliasRoot: input.aliasRoot, layerAliases: input.layerAliases };
  const roles = new Set(Object.values(input.layers).map(layer => layer.role));
  return {
    "feod-structure/large-files": {
      ...common,
      enabled: Boolean(input.extra.largeFiles),
      largeFiles: input.extra.largeFiles,
    },
    "feod-structure/confine": {
      ...common,
      ...resolver,
      enabled: input.extra.confine.length > 0,
      confine: input.extra.confine,
    },
    "feod-structure/global-files": {
      ...common,
      enabled: roles.has("global") && input.globals.allowedFiles.length > 0,
      layers: input.layers,
      layerDirs: { global: input.layerDirs.global },
      allowedFiles: input.globals.allowedFiles,
    },
    "feod-structure/module-names": {
      ...common,
      enabled: roles.has("modules") && input.modules.forbiddenNames.length > 0,
      layers: input.layers,
      layerDirs: { modules: input.layerDirs.modules },
      forbiddenNames: input.modules.forbiddenNames,
      singleFileModules: input.singleFileModules,
      transitModules: input.transitModules,
    },
    "feod-structure/module-entries": {
      ...common,
      enabled: roles.has("modules") && input.modules.requirePublicEntry,
      layers: input.layers,
      layerDirs: { modules: input.layerDirs.modules },
      requirePublicEntry: input.modules.requirePublicEntry,
      publicEntries: input.modules.publicEntries,
      singleFileModules: input.singleFileModules,
      transitModules: input.transitModules,
    },
    "feod-structure/no-module-cycles": {
      ...common,
      ...resolver,
      enabled: roles.has("modules") && input.cycles.modules,
      typeEdges: input.cycles.types,
      layers: input.layers,
      layerDirs: input.layerDirs,
      singleFileModules: input.singleFileModules,
      transitModules: input.transitModules,
    },
    "feod-structure/no-file-cycles": {
      ...common,
      ...resolver,
      enabled: input.cycles.files,
      layers: input.layers,
      layerDirs: input.layerDirs,
      singleFileModules: input.singleFileModules,
      transitModules: input.transitModules,
    },
    "feod-structure/layer-imports": {
      ...common,
      ...resolver,
      globals: input.globals,
      publicEntries: input.modules.publicEntries,
      layers: input.layers,
      imports: input.imports,
      submodules: input.submodules,
      layerDirs: input.layerDirs,
      transitModules: input.transitModules,
      singleFileModules: input.singleFileModules,
      modulePages: input.modulePages,
      dependencies: input.dependencies,
    },
    "feod-structure/no-common-index": {
      enabled: roles.has("common"),
      ...common,
      ...resolver,
      layerDirs: { common: input.layerDirs.common },
    },
    "feod-structure/no-common-deep": {
      enabled: roles.has("common"),
      ...common,
      layerDirs: { common: input.layerDirs.common },
      maxDepth: input.common.maxDepth,
    },
    "feod-structure/no-zigzag-imports": {
      transitModules: input.transitModules,
      publicEntries: input.modules.publicEntries,
      enabled: roles.has("modules"),
      ...common,
      ...resolver,
      layerDirs: { modules: input.layerDirs.modules },
    },
    "feod-structure/no-unknown-files": {
      ...common,
      layers: input.layers,
      layerDirs: input.layerDirs,
      filesystem: input.inventory.uncovered,
    },
    "feod-structure/visibility-levels": { ...common, ...resolver, layerDirs: input.layerDirs, levels: input.levels },
    "feod-structure/no-submodule-of-submodule": {
      enabled: roles.has("modules"),
      ...common,
      ...resolver,
      layerDirs: { modules: input.layerDirs.modules },
    },
    "feod-structure/pages-private-modules": {
      enabled: roles.has("pages"),
      ...common,
      ...resolver,
      layerDirs: { pages: input.layerDirs.pages },
    },
  };
}

export { default as recommended } from "./recommended.js";
export { default as strict } from "./strict.js";
