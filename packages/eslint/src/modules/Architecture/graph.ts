import fs from "node:fs";
import path from "node:path";

import { extractStaticDependencies, type ExtractedDependency } from "./extract-imports.js";
import { createIgnoreMatcher, type IgnorePatterns } from "../../common/ignore.js";
import { getInventory, type InventoryOptions } from "./inventory.js";
import { getLayerAliases, getLayerDirs, getLayers } from "./layers.js";
import { formatModuleName, getModuleContext } from "./modules.js";
import { resolveImportOffline, type ResolveOptions } from "./resolve.js";

const SOURCE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".vue",
]);

export type DependencyRecord = ExtractedDependency & {
  fromFile: string;
  toFile?: string;
};

export type GraphCycle = {
  nodes: string[];
  labels: string[];
};

/** @deprecated Use GraphCycle. */
export type ModuleCycle = GraphCycle & { owners: string[] };

export type ModuleGraph = {
  srcRoot: string;
  edges: Map<string, Set<string>>;
  dependencies: DependencyRecord[];
  cycles: ModuleCycle[];
};

export type FileGraph = {
  srcRoot: string;
  edges: Map<string, Set<string>>;
  dependencies: DependencyRecord[];
  cycles: GraphCycle[];
};

export type GraphOptions = InventoryOptions & {
  aliasPrefix?: string;
  aliasRoot?: string;
  layerAliases?: Record<string, string>;
  /** Module graph only: `include` also counts type-only edges, except from a module into an ancestor. */
  typeEdges?: "ignore" | "include";
};

type CacheEntry<T> = { key: string; value: T };

const moduleCache = new Map<string, CacheEntry<ModuleGraph>>();
const fileCache = new Map<string, CacheEntry<FileGraph>>();

function toPosix(value: string) {
  return value.replace(/\\/g, "/");
}

function isSourceFile(relativePath: string) {
  const base = path.posix.basename(relativePath);
  if (base.endsWith(".d.ts") || base.endsWith(".d.mts") || base.endsWith(".d.cts")) return false;
  return SOURCE_EXTENSIONS.has(path.posix.extname(base));
}

function cacheKey(options: GraphOptions) {
  return JSON.stringify({
    rootDir: path.resolve(options.rootDir),
    srcRoot: toPosix(options.srcRoot),
    layers: options.layers ?? null,
    layerDirs: options.layerDirs ?? null,
    ignore: options.ignore ?? null,
    singleFileModules: options.singleFileModules ?? false,
    transitModules: options.transitModules ?? [],
    publicEntries: options.publicEntries ?? [],
    aliasPrefix: options.aliasPrefix ?? "@",
    aliasRoot: options.aliasRoot ?? options.srcRoot,
    layerAliases: options.layerAliases ?? null,
    typeEdges: options.typeEdges ?? "ignore",
  });
}

function resolveOptionsFor(options: GraphOptions): ResolveOptions {
  const srcRoot = toPosix(options.srcRoot);
  const dirs = getLayerDirs(srcRoot, options.layerDirs, options.layers);
  return {
    rootDir: path.resolve(options.rootDir),
    aliasPrefix: options.aliasPrefix ?? "@",
    aliasRoot: options.aliasRoot ?? srcRoot,
    srcRoot,
    layerAliases: getLayerAliases(dirs, options.layerAliases),
    crossRoot: true,
  };
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

function listLayerSourceFiles(options: GraphOptions): string[] {
  const rootDir = path.resolve(options.rootDir);
  const srcRoot = toPosix(options.srcRoot);
  const layers = getLayers(srcRoot, options.layerDirs, options.layers);
  const isIgnored = createIgnoreMatcher(options.ignore as IgnorePatterns, rootDir);
  const files = new Set<string>();
  for (const layer of layers) {
    for (const file of listFiles(path.join(rootDir, layer.dir), rootDir, isIgnored)) {
      if (isSourceFile(file)) files.add(file);
    }
  }
  return [...files].sort();
}

function stronglyConnected(nodes: string[], edges: Map<string, Set<string>>): string[][] {
  let index = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const components: string[][] = [];

  function strongConnect(node: string) {
    indices.set(node, index);
    lowlinks.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);

    for (const next of edges.get(node) ?? []) {
      if (!indices.has(next)) {
        strongConnect(next);
        lowlinks.set(node, Math.min(lowlinks.get(node)!, lowlinks.get(next)!));
      } else if (onStack.has(next)) {
        lowlinks.set(node, Math.min(lowlinks.get(node)!, indices.get(next)!));
      }
    }

    if (lowlinks.get(node) === indices.get(node)) {
      const component: string[] = [];
      let current: string;
      do {
        current = stack.pop()!;
        onStack.delete(current);
        component.push(current);
      } while (current !== node);
      components.push(component);
    }
  }

  for (const node of nodes) {
    if (!indices.has(node)) strongConnect(node);
  }
  return components;
}

function cycleFromComponent(nodes: string[], edges: Map<string, Set<string>>): string[] | null {
  if (nodes.length === 1) {
    const sole = nodes[0]!;
    return edges.get(sole)?.has(sole) ? [sole, sole] : null;
  }
  const set = new Set(nodes);
  const start = [...nodes].sort()[0]!;
  const route = [start];
  const visited = new Set<string>([start]);
  while (route.length <= nodes.length + 1) {
    const current = route[route.length - 1]!;
    const next = [...(edges.get(current) ?? [])]
      .filter(node => set.has(node))
      .sort((a, b) => a.localeCompare(b))
      .find(node => !visited.has(node) || node === start);
    if (!next) break;
    route.push(next);
    if (next === start) return route;
    visited.add(next);
  }
  const ordered = [...nodes].sort();
  return [...ordered, ordered[0]!];
}

function collectValueDependencies(files: readonly string[], options: GraphOptions, includeTypes = false): DependencyRecord[] {
  const rootDir = path.resolve(options.rootDir);
  const resolveOptions = resolveOptionsFor(options);
  const dependencies: DependencyRecord[] = [];

  for (const relative of files) {
    const absolute = path.join(rootDir, relative);
    let source: string;
    try {
      source = fs.readFileSync(absolute, "utf8");
    } catch {
      continue;
    }
    for (const dependency of extractStaticDependencies(source, relative)) {
      if (dependency.typeOnly && !includeTypes) continue;
      const resolved = resolveImportOffline(dependency.specifier, absolute, resolveOptions);
      if (resolved.status !== "resolved") continue;
      const toFile = toPosix(path.relative(rootDir, resolved.canonical));
      if (!toFile || toFile.startsWith("..") || path.isAbsolute(toFile)) continue;
      dependencies.push({
        ...dependency,
        fromFile: relative,
        toFile,
      });
    }
  }
  return dependencies;
}

function cyclesFromEdges(edges: Map<string, Set<string>>, label = (node: string) => node): GraphCycle[] {
  const nodes = [...new Set([...edges.keys(), ...[...edges.values()].flatMap(set => [...set])])].sort();
  const cycles: GraphCycle[] = [];
  for (const component of stronglyConnected(nodes, edges)) {
    const route = cycleFromComponent(component, edges);
    if (!route) continue;
    cycles.push({
      nodes: route,
      labels: route.map(label),
    });
  }
  cycles.sort((a, b) => a.nodes.join("\0").localeCompare(b.nodes.join("\0")));
  return cycles;
}

/** Build the module-owner value-import graph for one FEOD root. */
export function buildModuleGraph(options: GraphOptions): ModuleGraph {
  const rootDir = path.resolve(options.rootDir);
  const srcRoot = toPosix(options.srcRoot);
  const inventory = getInventory(options);
  const layers = getLayers(srcRoot, options.layerDirs, options.layers);
  const modulesLayer = layers.find(layer => layer.role === "modules");
  const edges = new Map<string, Set<string>>();
  const labels = new Map<string, string>();

  if (!modulesLayer) {
    return { srcRoot, edges, dependencies: [], cycles: [] };
  }

  const files = new Set<string>();
  for (const module of inventory.modules) {
    for (const file of module.files) {
      if (isSourceFile(file)) files.add(file);
    }
  }
  const dependencies = collectValueDependencies([...files].sort(), options, options.typeEdges === "include");

  for (const dependency of dependencies) {
    if (!dependency.toFile) continue;
    const from = getModuleContext(path.join(rootDir, dependency.fromFile), rootDir, modulesLayer.dir, options.singleFileModules ?? false);
    const to = getModuleContext(path.join(rootDir, dependency.toFile), rootDir, modulesLayer.dir, options.singleFileModules ?? false);
    if (!from || !to || from.ownerRoot === to.ownerRoot) continue;
    // A type-only import of an ancestor is not a real initialization cycle.
    if (dependency.typeOnly && from.ownerRoot.startsWith(`${to.ownerRoot}/`)) continue;
    labels.set(from.ownerRoot, formatModuleName(from));
    labels.set(to.ownerRoot, formatModuleName(to));
    if (!edges.has(from.ownerRoot)) edges.set(from.ownerRoot, new Set());
    edges.get(from.ownerRoot)!.add(to.ownerRoot);
  }

  const cycles = cyclesFromEdges(edges, node => labels.get(node) ?? node).map(cycle => ({
    ...cycle,
    owners: cycle.nodes,
  }));

  return { srcRoot, edges, dependencies, cycles };
}

/** Build the file-level value-import graph across all FEOD layers. */
export function buildFileGraph(options: GraphOptions): FileGraph {
  const srcRoot = toPosix(options.srcRoot);
  const files = listLayerSourceFiles(options);
  const dependencies = collectValueDependencies(files, options);
  const edges = new Map<string, Set<string>>();

  for (const dependency of dependencies) {
    if (!dependency.toFile || dependency.fromFile === dependency.toFile) continue;
    if (!files.includes(dependency.toFile)) continue;
    if (!edges.has(dependency.fromFile)) edges.set(dependency.fromFile, new Set());
    edges.get(dependency.fromFile)!.add(dependency.toFile);
  }

  return {
    srcRoot,
    edges,
    dependencies,
    cycles: cyclesFromEdges(edges),
  };
}

/** Lazy run-scoped module graph for cycle rules. */
export function getModuleGraph(options: GraphOptions): ModuleGraph {
  const key = cacheKey(options);
  const scope = `${path.resolve(options.rootDir)}\0${toPosix(options.srcRoot)}\0module-graph`;
  const cached = moduleCache.get(scope);
  if (cached?.key === key) return cached.value;
  const value = buildModuleGraph(options);
  moduleCache.set(scope, { key, value });
  return value;
}

/** Lazy run-scoped file graph for cycle rules. */
export function getFileGraph(options: GraphOptions): FileGraph {
  const key = cacheKey(options);
  const scope = `${path.resolve(options.rootDir)}\0${toPosix(options.srcRoot)}\0file-graph`;
  const cached = fileCache.get(scope);
  if (cached?.key === key) return cached.value;
  const value = buildFileGraph(options);
  fileCache.set(scope, { key, value });
  return value;
}

export function clearGraphState() {
  moduleCache.clear();
  fileCache.clear();
}
