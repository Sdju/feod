import fs from "node:fs";
import path from "node:path";

import { createIgnoreMatcher, type IgnorePatterns } from "../../common/ignore.js";
import { getLayers, type LayerDirs } from "./layers.js";
import type { LayerSet } from "../Layers/index.js";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".vue"]);

export type InventoryModule = {
  ownerRoot: string;
  moduleName: string;
  names: string[];
  kind: "directory" | "single-file" | "transit-submodule";
  depth: number;
  files: string[];
  hasPublicEntry: boolean;
  isEmpty: boolean;
  isAssetOnly: boolean;
};

export type RootInventory = {
  srcRoot: string;
  modules: InventoryModule[];
  uncovered: string[];
};

export type InventoryOptions = {
  rootDir: string;
  srcRoot: string;
  layers?: LayerSet;
  layerDirs?: LayerDirs;
  ignore?: IgnorePatterns;
  singleFileModules?: boolean;
  transitModules?: string[];
  publicEntries?: readonly string[];
};

const runCache = new Map<string, RootInventory>();
const reported = new Set<string>();

function toPosix(value: string) {
  return value.replace(/\\/g, "/");
}

function isSourceFile(relativePath: string) {
  const base = path.posix.basename(relativePath);
  if (base.endsWith(".d.ts") || base.endsWith(".d.mts") || base.endsWith(".d.cts")) return false;
  return SOURCE_EXTENSIONS.has(path.posix.extname(base));
}

function hasPublicEntry(ownerRoot: string, files: readonly string[], entries: readonly string[]) {
  const direct = files.filter(file => path.posix.dirname(file) === ownerRoot).map(file => path.posix.basename(file));
  if (entries.length) return entries.some(name => direct.includes(name));
  return direct.some(name => name === "index" || name.startsWith("index."));
}

function listFiles(absoluteDir: string, rootDir: string, isIgnored: (file: string) => boolean): string[] {
  if (!fs.existsSync(absoluteDir)) return [];
  const out: string[] = [];
  const stack = [absoluteDir];
  while (stack.length) {
    const current = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (isIgnored(absolute)) continue;
      if (entry.isSymbolicLink()) {
        let stats: fs.Stats;
        try {
          stats = fs.statSync(absolute);
        } catch {
          continue;
        }
        if (stats.isDirectory()) stack.push(absolute);
        else if (stats.isFile()) out.push(toPosix(path.relative(rootDir, absolute)));
        continue;
      }
      if (entry.isDirectory()) stack.push(absolute);
      else if (entry.isFile()) out.push(toPosix(path.relative(rootDir, absolute)));
    }
  }
  return out.sort();
}

function collectDirectoryModule(
  ownerRoot: string,
  moduleName: string,
  names: string[],
  depth: number,
  kind: InventoryModule["kind"],
  ownedFiles: string[],
  publicEntries: readonly string[],
): InventoryModule {
  const files = [...ownedFiles].sort();
  const sourceFiles = files.filter(isSourceFile);
  return {
    ownerRoot,
    moduleName,
    names,
    kind,
    depth,
    files,
    hasPublicEntry: kind === "single-file" ? true : hasPublicEntry(ownerRoot, files, publicEntries),
    isEmpty: files.length === 0,
    isAssetOnly: files.length > 0 && sourceFiles.length === 0,
  };
}

function discoverModules(
  modulesDir: string,
  allFiles: readonly string[],
  options: Required<Pick<InventoryOptions, "singleFileModules" | "publicEntries">> & {
    transitModules: ReadonlySet<string>;
  },
): InventoryModule[] {
  const prefix = `${modulesDir}/`;
  const moduleFiles = allFiles.filter(file => file === modulesDir || file.startsWith(prefix));
  const modules: InventoryModule[] = [];
  const seen = new Set<string>();

  const topNames = new Set<string>();
  for (const file of moduleFiles) {
    const rest = file.slice(prefix.length);
    if (!rest) continue;
    topNames.add(rest.split("/")[0]!);
  }

  function register(module: InventoryModule) {
    if (seen.has(module.ownerRoot)) return;
    seen.add(module.ownerRoot);
    modules.push(module);
  }

  function walkDirectoryOwner(
    ownerRoot: string,
    moduleName: string,
    names: string[],
    depth: number,
    transitChild: boolean,
  ) {
    const nestedPrefix = `${ownerRoot}/modules/`;
    const childNames = new Set<string>();
    for (const file of moduleFiles) {
      if (!file.startsWith(nestedPrefix)) continue;
      const child = file.slice(nestedPrefix.length).split("/")[0];
      if (child) childNames.add(child);
    }

    const transit = depth === 0 && options.transitModules.has(moduleName);
    const transitChildren = new Set<string>();
    if (transit) {
      for (const file of moduleFiles) {
        if (!file.startsWith(`${ownerRoot}/`)) continue;
        const rest = file.slice(ownerRoot.length + 1);
        const [first] = rest.split("/");
        if (first && first !== "modules" && first !== "_") transitChildren.add(first);
      }
    }

    const owned = moduleFiles.filter(file => {
      if (file === ownerRoot) return false;
      if (!file.startsWith(`${ownerRoot}/`)) return false;
      const rest = file.slice(ownerRoot.length + 1);
      if (rest.startsWith("modules/")) return false;
      if (transit) {
        const first = rest.split("/")[0];
        if (first && first !== "_") return false;
      }
      return true;
    });

    register(
      collectDirectoryModule(
        ownerRoot,
        moduleName,
        names,
        depth,
        transitChild ? "transit-submodule" : "directory",
        owned,
        options.publicEntries,
      ),
    );

    for (const child of [...childNames].sort()) {
      walkDirectoryOwner(`${ownerRoot}/modules/${child}`, moduleName, [...names, child], depth + 1, false);
    }
    if (transit) {
      for (const child of [...transitChildren].sort()) {
        walkDirectoryOwner(`${ownerRoot}/${child}`, moduleName, [...names, child], depth + 1, true);
      }
    }
  }

  for (const top of [...topNames].sort()) {
    const topPath = `${modulesDir}/${top}`;
    if (path.posix.extname(top)) {
      if (!options.singleFileModules) continue;
      const owned = moduleFiles.filter(file => file === topPath);
      register(
        collectDirectoryModule(
          topPath,
          path.posix.parse(top).name,
          [path.posix.parse(top).name],
          0,
          "single-file",
          owned,
          options.publicEntries,
        ),
      );
      continue;
    }
    walkDirectoryOwner(topPath, top, [top], 0, false);
  }

  return modules.sort((a, b) => a.ownerRoot.localeCompare(b.ownerRoot));
}

function discoverEmptyDirectories(
  absoluteModulesDir: string,
  rootDir: string,
  isIgnored: (file: string) => boolean,
  existing: ReadonlySet<string>,
  options: Required<Pick<InventoryOptions, "singleFileModules" | "publicEntries">> & {
    transitModules: ReadonlySet<string>;
  },
): InventoryModule[] {
  if (!fs.existsSync(absoluteModulesDir)) return [];
  const extras: InventoryModule[] = [];

  function visit(absoluteOwner: string, moduleName: string, names: string[], depth: number, transitChild: boolean) {
    const ownerRoot = toPosix(path.relative(rootDir, absoluteOwner));
    if (!existing.has(ownerRoot) && !isIgnored(absoluteOwner)) {
      extras.push(
        collectDirectoryModule(
          ownerRoot,
          moduleName,
          names,
          depth,
          transitChild ? "transit-submodule" : "directory",
          [],
          options.publicEntries,
        ),
      );
    }
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(absoluteOwner, { withFileTypes: true });
    } catch {
      return;
    }
    const nested = entries.find(entry => entry.name === "modules" && (entry.isDirectory() || entry.isSymbolicLink()));
    if (nested) {
      const nestedDir = path.join(absoluteOwner, "modules");
      let children: fs.Dirent[];
      try {
        children = fs.readdirSync(nestedDir, { withFileTypes: true });
      } catch {
        children = [];
      }
      for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
        if (!(child.isDirectory() || child.isSymbolicLink()) || child.name.startsWith(".")) continue;
        const absoluteChild = path.join(nestedDir, child.name);
        if (isIgnored(absoluteChild)) continue;
        visit(absoluteChild, moduleName, [...names, child.name], depth + 1, false);
      }
    }
    if (depth === 0 && options.transitModules.has(moduleName)) {
      for (const child of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (!(child.isDirectory() || child.isSymbolicLink())) continue;
        if (child.name === "modules" || child.name === "_" || child.name.startsWith(".")) continue;
        const absoluteChild = path.join(absoluteOwner, child.name);
        if (isIgnored(absoluteChild)) continue;
        visit(absoluteChild, moduleName, [...names, child.name], depth + 1, true);
      }
    }
  }

  let top: fs.Dirent[];
  try {
    top = fs.readdirSync(absoluteModulesDir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const entry of top.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".")) continue;
    const absolute = path.join(absoluteModulesDir, entry.name);
    if (isIgnored(absolute)) continue;
    if (entry.isFile() || (entry.isSymbolicLink() && fs.existsSync(absolute) && fs.statSync(absolute).isFile())) {
      if (!options.singleFileModules) continue;
      const ownerRoot = toPosix(path.relative(rootDir, absolute));
      if (existing.has(ownerRoot)) continue;
      extras.push(
        collectDirectoryModule(
          ownerRoot,
          path.posix.parse(entry.name).name,
          [path.posix.parse(entry.name).name],
          0,
          "single-file",
          [ownerRoot],
          options.publicEntries,
        ),
      );
      continue;
    }
    if (!(entry.isDirectory() || entry.isSymbolicLink())) continue;
    visit(absolute, entry.name, [entry.name], 0, false);
  }

  return extras;
}

/** One filesystem pass for a FEOD root: module owners, entries and uncovered files. */
export function buildInventory(options: InventoryOptions): RootInventory {
  const rootDir = path.resolve(options.rootDir);
  const srcRoot = toPosix(options.srcRoot);
  const layers = getLayers(srcRoot, options.layerDirs, options.layers);
  const isIgnored = createIgnoreMatcher(options.ignore, rootDir);
  const absoluteRoot = path.join(rootDir, srcRoot);
  const allFiles = listFiles(absoluteRoot, rootDir, isIgnored);
  const uncovered = allFiles.filter(
    file => !layers.some(layer => file === layer.dir || file.startsWith(`${layer.dir}/`)),
  );
  const modulesLayer = layers.find(layer => layer.role === "modules");
  const publicEntries = options.publicEntries ?? [];
  const singleFileModules = options.singleFileModules ?? false;
  const transitModules = new Set(options.transitModules ?? []);

  if (!modulesLayer) {
    return { srcRoot, modules: [], uncovered };
  }

  const fromFiles = discoverModules(modulesLayer.dir, allFiles, { singleFileModules, publicEntries, transitModules });
  const existing = new Set(fromFiles.map(module => module.ownerRoot));
  const empty = discoverEmptyDirectories(path.join(rootDir, modulesLayer.dir), rootDir, isIgnored, existing, {
    singleFileModules,
    publicEntries,
    transitModules,
  });
  return {
    srcRoot,
    modules: [...fromFiles, ...empty].sort((a, b) => a.ownerRoot.localeCompare(b.ownerRoot)),
    uncovered,
  };
}

function cacheKey(options: InventoryOptions) {
  return JSON.stringify({
    rootDir: path.resolve(options.rootDir),
    srcRoot: toPosix(options.srcRoot),
    layers: options.layers ?? null,
    layerDirs: options.layerDirs ?? null,
    ignore: options.ignore ?? null,
    singleFileModules: options.singleFileModules ?? false,
    transitModules: options.transitModules ?? [],
    publicEntries: options.publicEntries ?? [],
  });
}

/** Lazy run-scoped inventory: one walk per options fingerprint (rules with different options must not evict each other). */
export function getInventory(options: InventoryOptions): RootInventory {
  const key = cacheKey(options);
  const cached = runCache.get(key);
  if (cached) return cached;
  const inventory = buildInventory(options);
  runCache.set(key, inventory);
  return inventory;
}

/** Deduplicate inventory diagnostics that attach to an arbitrary linted file. */
export function reportInventoryOnce(key: string, report: () => void) {
  if (reported.has(key)) return;
  reported.add(key);
  report();
}

/** Test helper: drop run-scoped inventory and report dedupe state. */
export function clearInventoryState() {
  runCache.clear();
  reported.clear();
}
