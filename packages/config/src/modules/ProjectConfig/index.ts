import fs from "node:fs";
import path from "node:path";
import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";

import { frontendLayers, type LayerSet } from "../Layers/index.js";
import {
  DEFAULT_LARGE_FILE_LIMIT,
  confineProblem,
  type ConfinePolicy,
  type CyclesPolicy,
  type GlobalFilesPolicy,
  type ImportPolicy,
  type InventoryPolicy,
  type LargeFilesPolicy,
  type LayerAliases,
  type LayerDirs,
  type ModulePolicy,
  type SubmodulePolicy,
} from "../Policies/index.js";
import schema from "./feod.schema.json";

export type FeodRootConfig = {
  globals?: GlobalFilesPolicy;
  /** Opt-in rules outside FEOD structure; off in presets until configured. */
  extra?: { largeFiles?: LargeFilesPolicy; confine?: ConfinePolicy };
  modules?: ModulePolicy;
  inventory?: InventoryPolicy;
  cycles?: CyclesPolicy;
  imports?: ImportPolicy;
  submodules?: SubmodulePolicy;
  layers?: LayerSet;
  dependencies?: string[];
  aliasPrefix?: string;
  aliasRoot?: string;
  layerDirs?: LayerDirs;
  layerAliases?: LayerAliases;
  ignore?: string | string[];
  common?: { maxDepth?: number };
  transitModules?: string[];
  singleFileModules?: boolean;
  modulePages?: boolean;
  levels?: { name: string; visibility: "default" | "transparent" | "open"; maxDepth?: number }[];
};

export type FeodConfig = FeodRootConfig & {
  $schema?: string;
  rootDefault?: FeodRootConfig;
} & (
    | { /** @deprecated Use roots instead. */ srcRoot?: string; roots?: never }
    | { roots: Record<string, FeodRootConfig>; srcRoot?: never }
  );
export type LoadOptions = { rootDir?: string };
export type NormalizedRootConfig = Required<
  Omit<
    FeodRootConfig,
    | "layerDirs"
    | "ignore"
    | "common"
    | "submodules"
    | "imports"
    | "globals"
    | "modules"
    | "inventory"
    | "cycles"
    | "extra"
  >
> & {
  extra: { largeFiles?: Required<LargeFilesPolicy>; confine: ConfinePolicy };
  globals: Required<GlobalFilesPolicy>;
  modules: Required<ModulePolicy>;
  inventory: Required<InventoryPolicy>;
  cycles: Required<CyclesPolicy>;
  imports: Required<ImportPolicy>;
  submodules: Required<SubmodulePolicy>;
  layerDirs: Required<LayerDirs>;
  ignore: string[];
  common: { maxDepth: number };
};
export type NormalizedFeodConfig = {
  rootDefault: FeodRootConfig;
  roots: Record<string, NormalizedRootConfig>;
};
export type LoadedFeodConfig = { rootDir: string; config: NormalizedFeodConfig; filepath?: string };

export class FeodConfigError extends Error {
  constructor(message: string) {
    super(`FEOD configuration: ${message}`);
    this.name = "FeodConfigError";
  }
}

// Compile once, only when the configuration API is used. Importing the plugin
// does not read the filesystem or make configuration-dependent decisions.
let validate: ReturnType<Ajv["compile"]> | undefined;
function validationErrors(config: unknown): ErrorObject[] | null {
  if (!validate) {
    const ajv = new Ajv({ allErrors: true, ownProperties: true });
    addFormats(ajv);
    validate = ajv.compile(schema);
  }
  return validate(config) ? null : (validate.errors ?? []);
}

/** Validates an inline configuration object and fills every default; `source` labels errors. */
export function normalizeFeodConfig(config: unknown, source: string): NormalizedFeodConfig {
  const errors = validationErrors(config);
  if (errors) {
    const details = errors
      .map(error => {
        if (error.keyword === "not") return "/: srcRoot and roots cannot be configured together";
        let field = error.instancePath || "/";
        if (error.keyword === "additionalProperties")
          field = `${error.instancePath}/${error.params.additionalProperty}`;
        if (error.keyword === "required") field = `${error.instancePath}/${error.params.missingProperty}`;
        return `${field}: ${error.message}`;
      })
      .join("; ");
    throw new FeodConfigError(`${source}: ${details}`);
  }
  const input = config as FeodConfig;
  const { $schema: _schema, srcRoot, roots, rootDefault, ...legacy } = input;
  // Normalize legacy srcRoot to the same canonical roots map.
  const defaults = mergeRootOptions(legacy, rootDefault ?? {});
  const entries = roots ?? { [srcRoot ?? "src"]: {} };
  const normalized: Record<string, NormalizedRootConfig> = Object.create(null);
  for (const [directory, overrides] of Object.entries(entries)) {
    const root = relativePath(directory);
    if (root === ".." || root.startsWith("../"))
      throw new FeodConfigError(`${source}: /roots/${directory}: root escapes the project`);
    if (Object.prototype.hasOwnProperty.call(normalized, root))
      throw new FeodConfigError(`${source}: /roots/${directory}: duplicate normalized root '${root}'`);
    const entry = mergeRootOptions(defaults, overrides);
    const problem = confineProblem(entry.extra?.confine ?? []);
    if (problem) throw new FeodConfigError(`${source}: /roots/${directory}/extra/confine${problem}`);
    normalized[root] = normalizeRoot(entry, root);
  }
  for (const [root, options] of Object.entries(normalized)) {
    for (const dependency of options.dependencies) {
      if (!Object.prototype.hasOwnProperty.call(normalized, dependency))
        throw new FeodConfigError(`${source}: /roots/${root}/dependencies: unknown root '${dependency}'`);
    }
  }
  return { rootDefault: defaults, roots: normalized };
}

const relativePath = (value: string) => path.posix.normalize(value.replace(/\\/g, "/"));

function mergeRootOptions(base: FeodRootConfig, overrides: FeodRootConfig): FeodRootConfig {
  return {
    ...base,
    ...overrides,
    layerDirs: { ...base.layerDirs, ...overrides.layerDirs },
    layerAliases: { ...base.layerAliases, ...overrides.layerAliases },
    globals: { ...base.globals, ...overrides.globals },
    extra: { ...base.extra, ...overrides.extra },
    modules: { ...base.modules, ...overrides.modules },
    inventory: { ...base.inventory, ...overrides.inventory },
    cycles: { ...base.cycles, ...overrides.cycles },
    common: { ...base.common, ...overrides.common },
    imports: { ...base.imports, ...overrides.imports },
    submodules: { ...base.submodules, ...overrides.submodules },
  };
}

function normalizeRoot(input: FeodRootConfig, srcRoot: string): NormalizedRootConfig {
  const layerDirs = {
    app: "app",
    pages: "pages",
    modules: "modules",
    common: "common",
    global: "global",
    ...input.layerDirs,
  };
  for (const key of Object.keys(layerDirs) as (keyof LayerDirs)[]) layerDirs[key] = relativePath(layerDirs[key]);
  const layers: Record<string, LayerSet[string]> = Object.create(null);
  const roles = new Set<string>();
  const directories = new Set<string>();
  const definitions = input.layers ?? frontendLayers;
  for (const [name, definition] of Object.entries(definitions)) {
    for (const target of definition.imports) {
      if (!Object.prototype.hasOwnProperty.call(definitions, target)) {
        throw new FeodConfigError(`layers/${name}/imports: unknown layer '${target}'`);
      }
    }
    if (definition.role && roles.has(definition.role))
      throw new FeodConfigError(`layers/${name}/role: duplicate role '${definition.role}'`);
    if (definition.role) roles.add(definition.role);
    const dir = relativePath((definition.role && input.layerDirs?.[definition.role]) ?? definition.dir ?? name);
    if (path.posix.isAbsolute(dir) || /^[A-Za-z]:/.test(dir) || dir === ".." || dir.startsWith("../"))
      throw new FeodConfigError(`layers/${name}/dir: layer escapes its root`);
    if (directories.has(dir)) throw new FeodConfigError(`layers/${name}/dir: duplicate layer directory '${dir}'`);
    directories.add(dir);
    if (definition.role) layerDirs[definition.role] = dir;
    layers[name] = { ...definition, dir, imports: [...definition.imports] };
  }
  const layerAliases = {
    ...Object.fromEntries(
      Object.entries(layers).map(([name, layer]) => [`@${name}`, path.posix.join(srcRoot, layer.dir!)]),
    ),
    ...input.layerAliases,
  };
  for (const key of Object.keys(layerAliases)) layerAliases[key] = relativePath(layerAliases[key]);
  return {
    layers,
    extra: {
      confine: (input.extra?.confine ?? []).map(entry => ({
        name: entry.name,
        imports: [...(entry.imports ?? [])],
        targets: [...(entry.targets ?? [])],
        literals: [...(entry.literals ?? [])],
        allowedIn: [...(entry.allowedIn ?? [])],
        allowTypeImports: entry.allowTypeImports ?? false,
        ...(entry.message ? { message: entry.message } : {}),
      })),
      ...(input.extra?.largeFiles
        ? {
            largeFiles: {
              thresholds: { default: DEFAULT_LARGE_FILE_LIMIT, ...input.extra.largeFiles.thresholds },
              files: Object.fromEntries(
                Object.entries(input.extra.largeFiles.files ?? {}).map(([file, entry]) => [
                  relativePath(file),
                  { ...entry },
                ]),
              ),
            },
          }
        : {}),
    },
    globals: {
      allowedFiles: [...(input.globals?.allowedFiles ?? [])],
      localImports: input.globals?.localImports ?? "allow",
    },
    modules: {
      forbiddenNames: [...(input.modules?.forbiddenNames ?? [])],
      publicEntries: [...(input.modules?.publicEntries ?? [])],
      requirePublicEntry: input.modules?.requirePublicEntry ?? false,
    },
    inventory: { uncovered: input.inventory?.uncovered ?? false },
    cycles: {
      modules: input.cycles?.modules ?? false,
      files: input.cycles?.files ?? false,
      types: input.cycles?.types ?? "ignore",
    },
    imports: { computed: "ignore", unresolved: "ignore", ...input.imports },
    submodules: {
      visibility: "public",
      parentImports: "public",
      childImportsParent: "implementation",
      ...input.submodules,
    },
    aliasPrefix: input.aliasPrefix ?? "@",
    aliasRoot: relativePath(input.aliasRoot ?? srcRoot),
    layerDirs,
    layerAliases,
    ignore: typeof input.ignore === "string" ? [input.ignore] : [...(input.ignore ?? [])],
    common: { maxDepth: input.common?.maxDepth ?? 1 },
    transitModules: [...(input.transitModules ?? [])],
    singleFileModules: input.singleFileModules ?? false,
    modulePages: input.modulePages ?? false,
    levels: (input.levels ?? []).map(level => ({ ...level })),
    dependencies: (input.dependencies ?? []).map(relativePath),
  };
}

function readJson(filename: string): { value: unknown } | undefined {
  let contents: string;
  try {
    contents = fs.readFileSync(filename, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw new FeodConfigError(`${filename}: ${(error as Error).message}`);
  }
  try {
    return { value: JSON.parse(contents.replace(/^\uFEFF/, "")) };
  } catch (error) {
    throw new FeodConfigError(`${filename}: invalid JSON: ${(error as Error).message}`);
  }
}

export function loadFeodConfig(options: LoadOptions = {}): LoadedFeodConfig {
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const filename = path.join(rootDir, "feod.config.json");
  const packageFile = path.join(rootDir, "package.json");
  const standalone = readJson(filename);
  const pkg = readJson(packageFile);
  if (pkg && (pkg.value === null || typeof pkg.value !== "object" || Array.isArray(pkg.value))) {
    throw new FeodConfigError(`${packageFile}: /: must be an object`);
  }
  const hasSection = pkg !== undefined && Object.prototype.hasOwnProperty.call(pkg.value, "feod");
  if (standalone && hasSection) {
    throw new FeodConfigError(`both ${filename} and ${packageFile}#/feod are configured; keep one source`);
  }
  const filepath = standalone ? filename : hasSection ? packageFile : undefined;
  const input = standalone ? standalone.value : hasSection ? (pkg!.value as { feod: unknown }).feod : {};
  const source = hasSection ? `${packageFile}#/feod` : (filepath ?? rootDir);
  return { rootDir, config: normalizeFeodConfig(input, source), ...(filepath ? { filepath } : {}) };
}
