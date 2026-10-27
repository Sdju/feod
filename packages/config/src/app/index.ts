export { loadFeodConfig, normalizeFeodConfig, FeodConfigError } from "../modules/ProjectConfig/index.js";
export type {
  FeodConfig,
  FeodRootConfig,
  LoadOptions,
  LoadedFeodConfig,
  NormalizedFeodConfig,
  NormalizedRootConfig,
} from "../modules/ProjectConfig/index.js";
export { frontendLayers, backendLayers, libraryLayers, cliLayers } from "../modules/Layers/index.js";
export type { LayerSet, LayerDefinition, LayerRole } from "../modules/Layers/index.js";
export { DEFAULT_LARGE_FILE_LIMIT, confineProblem } from "../modules/Policies/index.js";
export type {
  SubmodulePolicy,
  ImportPolicy,
  GlobalFilesPolicy,
  ModuleNamesPolicy,
  ModulePolicy,
  InventoryPolicy,
  CyclesPolicy,
  LayerDirs,
  LayerAliases,
  LargeFileEntry,
  LargeFilesPolicy,
  ConfineEntry,
  ConfinePolicy,
} from "../modules/Policies/index.js";
import schema from "../modules/ProjectConfig/feod.schema.json";

/** JSON Schema of `package.json#feod` / `feod.config.json`. */
// Loosely typed on purpose: consumers (editors, tests) walk the schema, and the JSON import cannot be named in declarations.
// oxlint-disable-next-line typescript/no-explicit-any
export const feodSchema: { $id: string; definitions: Record<string, any>; [key: string]: any } = schema;
