import { existsSync, readdirSync, statSync } from "node:fs";
import { join, posix } from "node:path";

import type { NormalizedRootConfig } from "@o-feod/config";

import type { LayerInfo, ModuleInfo, RootInfo } from "./types.js";

const SOURCE = /\.(?:[cm]?[jt]sx?|vue|svelte)$/;
const ENTRY_NAMES = ["index.ts", "index.tsx", "index.js", "index.jsx", "index.mjs", "index.mts", "index.vue"];

const isDirectory = (path: string) => existsSync(path) && statSync(path).isDirectory();
const list = (path: string) => (isDirectory(path) ? readdirSync(path).sort() : []);

/** Entry candidates: configured public entries first, then conventional index files. */
export function findEntry(dir: string, publicEntries: string[]): string | null {
  for (const name of [...publicEntries, ...ENTRY_NAMES]) {
    if (existsSync(join(dir, name)) && statSync(join(dir, name)).isFile()) return name;
  }
  return null;
}

function scanModule(
  rootDir: string,
  modulesDir: string,
  name: string,
  config: NormalizedRootConfig,
): ModuleInfo | null {
  const full = join(modulesDir, name);
  const rel = posix.join(...full.slice(rootDir.length + 1).split(/[\\/]/));
  if (isDirectory(full)) {
    return {
      name,
      path: rel,
      kind: "directory",
      entry: findEntry(full, config.modules.publicEntries),
      transit: config.transitModules.includes(name),
      submodules: list(join(full, "modules")).filter(entry => isDirectory(join(full, "modules", entry))),
      hasPages: isDirectory(join(full, "pages")),
    };
  }
  if (!SOURCE.test(name)) return null;
  return { name, path: rel, kind: "file", entry: name, transit: false, submodules: [], hasPages: false };
}

/** Reads the disk for one configured root: which layers exist, which modules they hold. */
export function scanRoot(rootDir: string, root: string, config: NormalizedRootConfig): RootInfo {
  const rootPath = join(rootDir, root);
  const layers: LayerInfo[] = Object.entries(config.layers).map(([name, layer]) => ({
    name,
    role: layer.role ?? null,
    dir: layer.dir ?? name,
    exists: isDirectory(join(rootPath, layer.dir ?? name)),
    imports: [...layer.imports],
  }));
  const modulesDir = config.layerDirs.modules;
  const modulesPath = join(rootPath, modulesDir);
  const modules = list(modulesPath)
    .map(name => scanModule(rootDir, modulesPath, name, config))
    .filter((module): module is ModuleInfo => module !== null);
  const layerRoots = new Set(layers.map(layer => layer.dir.split("/")[0]));
  const uncovered = list(rootPath).filter(entry => !layerRoots.has(entry));
  return {
    root,
    exists: isDirectory(rootPath),
    aliasPrefix: config.aliasPrefix,
    aliasRoot: config.aliasRoot,
    layers,
    modules,
    uncovered,
    flags: {
      modulePages: config.modulePages,
      singleFileModules: config.singleFileModules,
      transitModules: config.transitModules,
    },
  };
}
