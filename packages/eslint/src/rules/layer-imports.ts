import { createIgnoreMatcher } from "../common/ignore.js";
import { createPathMemoizer } from "../common/cache.js";
import path from "node:path";
import type { Rule } from "eslint";

import {
  getFilename,
  importListeners,
  importPolicySchema,
  type ImportPolicy,
  getModuleContext,
  isPublicModuleImport,
  getTransitModuleInfo,
  isPublicTransitSubmoduleImport,
  type TransitInfo,
  publicEntriesSchema,
  formatModuleName,
  moduleAccess,
  submodulePolicySchema,
  type SubmodulePolicy,
  rootForPath,
  resolveImport,
  isMissingLocalImport,
  type LayerAliases,
  type LayerDirs,
  getLayerAliases,
  getLayerDirs,
  getLayers,
  layerSetSchema,
  type Layer,
  globalFilesSchema,
  type GlobalFilesPolicy,
} from "../modules/Architecture/index.js";

import type { LayerSet } from "../modules/Layers/index.js";

type Options = {
  globals?: GlobalFilesPolicy;
  publicEntries?: string[];
  imports?: ImportPolicy;
  submodules?: SubmodulePolicy;
  layers?: LayerSet;
  roots?: Record<string, Options>;
  dependencies?: string[];
  rootDir?: string;
  aliasPrefix?: string;
  aliasRoot?: string;
  ignore?: string | string[];
  srcRoot?: string;
  layerDirs?: LayerDirs;
  layerAliases?: LayerAliases;
  transitModules?: string[];
  singleFileModules?: boolean;
  modulePages?: boolean;
};

function toPosix(value: string) {
  return value.replace(/\\/g, "/");
}

function normalizeFilename(filename: string, rootDir: string) {
  if (!filename || filename.startsWith("<")) return null;
  if (path.isAbsolute(filename)) return filename;
  return path.resolve(rootDir, filename);
}

function getLayerForPath(filePath: string, rootDir: string, layers: readonly Layer[]) {
  if (!filePath || !rootDir) return null;
  const relative = toPosix(path.relative(rootDir, filePath));
  for (const layer of layers) {
    const normalizedDir = toPosix(layer.dir).replace(/\/$/, "");
    if (relative === normalizedDir || relative.startsWith(`${normalizedDir}/`)) {
      return layer;
    }
  }
  return null;
}

type ModulePagesInfo = {
  moduleName: string;
  pagesRoot: string;
};

function getModulePagesInfo(relativePath: string, modulesDir: string): ModulePagesInfo | null {
  if (!relativePath.startsWith(`${modulesDir}/`)) return null;
  const rest = relativePath.slice(modulesDir.length + 1);
  if (!rest) return null;
  const parts = rest.split("/");
  if (parts.length < 3) return null;
  if (parts[1] !== "pages") return null;
  return {
    moduleName: parts[0],
    pagesRoot: `${modulesDir}/${parts[0]}/pages`,
  };
}

const PAGE_STYLE_EXTENSIONS = new Set([".css", ".scss", ".sass", ".less", ".styl", ".stylus", ".pcss"]);

// A page owns its stylesheets: `home.tsx` -> `home.scss` / `home.module.scss`,
// and `home/index.tsx` -> any stylesheet inside `home/`. Other pages stay private.
function isOwnPageStyle(fromRelative: string, toRelative: string) {
  const to = path.posix.parse(toRelative);
  if (!PAGE_STYLE_EXTENSIONS.has(to.ext)) return false;
  const from = path.posix.parse(fromRelative);
  if (from.name === "index") {
    return to.dir === from.dir || to.dir.startsWith(`${from.dir}/`);
  }
  return to.dir === from.dir && (to.name === from.name || to.name.startsWith(`${from.name}.`));
}

function getModuleIndexName(relativePath: string, modulesDir: string) {
  if (!relativePath.startsWith(`${modulesDir}/`)) return null;
  const rest = relativePath.slice(modulesDir.length + 1);
  if (!rest) return null;
  const parts = rest.split("/");
  if (parts.length !== 2) return null;
  const parsed = path.posix.parse(parts[1]);
  if (parsed.name !== "index") return null;
  return parts[0];
}

function isAllowedTransitPrivateImport(importer: TransitInfo | null, target: TransitInfo) {
  if (!importer) return false;
  if (importer.moduleName !== target.moduleName) return false;
  return importer.type === "submodule" || importer.type === "private";
}

function isSameTransitSubmodule(importer: TransitInfo | null, target: TransitInfo) {
  if (!importer || importer.type !== "submodule") return false;
  if (target.type !== "submodule") return false;
  return importer.moduleName === target.moduleName && importer.submoduleName === target.submoduleName;
}

function reportInvalid(context: Rule.RuleContext, node: unknown, messageId: string, data: Record<string, string>) {
  context.report({
    node: node as Rule.Node,
    messageId,
    data,
  });
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce FEOD layer import rules",
    },
    schema: [
      {
        type: "object",
        properties: {
          globals: globalFilesSchema,
          publicEntries: publicEntriesSchema,
          imports: importPolicySchema,
          layers: layerSetSchema,
          submodules: submodulePolicySchema,
          rootDir: { type: "string" },
          dependencies: { type: "array", items: { type: "string" } },
          aliasPrefix: { type: "string" },
          aliasRoot: { type: "string" },
          ignore: {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
          },
          srcRoot: { type: "string" },
          layerDirs: {
            type: "object",
            properties: {
              app: { type: "string" },
              pages: { type: "string" },
              modules: { type: "string" },
              common: { type: "string" },
              global: { type: "string" },
            },
            additionalProperties: false,
          },
          layerAliases: {
            type: "object",
            additionalProperties: { type: "string" },
          },
          transitModules: {
            type: "array",
            items: { type: "string" },
          },
          singleFileModules: { type: "boolean" },
          modulePages: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidGlobalLocalImport: "FEOD: global local imports must follow the '{{policy}}' policy.",
      privateSubmodule: "FEOD: submodule '{{toName}}' is private to its immediate parent.",
      computedImport:
        "FEOD: computed {{loader}} specifiers are forbidden; use a static string or supported literal file URL.",
      unresolvedImport: "FEOD: import '{{specifier}}' could not be resolved to an existing local file.",
      invalidRootImport: "FEOD: root '{{fromRoot}}' cannot import from '{{toRoot}}'.",
      crossRootPublicOnly: "FEOD: imports from root '{{toRoot}}' must use a public top-level module API.",
      invalidLayerImport: "FEOD: '{{fromLayer}}' cannot import from '{{toLayer}}'.",
      invalidGlobalImport: "FEOD: '{{fromLayer}}' cannot import from 'global'.",
      invalidModuleImport: "FEOD: '{{fromName}}' can only import public API of '{{toName}}'.",
      pagesImportRestricted: "FEOD: '{{fromLayer}}' cannot import from 'pages'. Only 'app' can.",
      appImportRestricted: "FEOD: '{{fromLayer}}' cannot import from 'app'.",
      invalidTransitSubmoduleImport: "FEOD: transit submodules can only be imported via public API.",
      invalidTransitPrivateImport: "FEOD: private core of transit module is restricted to its submodules.",
      modulePagesImportRestricted: "FEOD: module pages can only be imported by the module index.",
    },
  },
  create(context: Rule.RuleContext) {
    const options = (context.options[0] || {}) as Options;
    const rootDir = path.resolve(options.rootDir || process.cwd());
    const aliasPrefix = options.aliasPrefix || "@";
    const srcRoot = options.srcRoot || "src";
    const aliasRoot = options.aliasRoot || srcRoot;
    const layerDirs = getLayerDirs(srcRoot, options.layerDirs, options.layers);
    const layerAliases = getLayerAliases(layerDirs, options.layerAliases);
    const layers = getLayers(srcRoot, options.layerDirs, options.layers);
    const filename = normalizeFilename(getFilename(context), rootDir);
    const isIgnored = createIgnoreMatcher(options.ignore, rootDir);
    const layerCache = createPathMemoizer(filePath => getLayerForPath(filePath, rootDir, layers));
    const moduleCache = createPathMemoizer(filePath =>
      layers.some(layer => layer.role === "modules")
        ? getModuleContext(filePath, rootDir, layerDirs.modules, Boolean(options.singleFileModules))
        : null,
    );
    const transitModules = new Set(options.transitModules || []);
    const transitCache = createPathMemoizer(filePath =>
      layers.some(layer => layer.role === "modules")
        ? getTransitModuleInfo(filePath, layerDirs.modules, transitModules)
        : null,
    );
    const modulePagesCache = createPathMemoizer(filePath => getModulePagesInfo(filePath, layerDirs.modules));
    const moduleIndexCache = createPathMemoizer(filePath => getModuleIndexName(filePath, layerDirs.modules));

    if (!filename || isIgnored(filename)) {
      return {};
    }

    function validateImport(node: unknown, sourceValue: string, typeOnly: boolean) {
      if (!filename) return;
      const resolution = resolveImport(sourceValue, context, filename, {
        rootDir,
        aliasPrefix,
        aliasRoot,
        srcRoot,
        layerAliases,
        crossRoot: true,
      });
      if (options.imports?.unresolved === "forbid" && isMissingLocalImport(resolution)) {
        reportInvalid(context, node, "unresolvedImport", { specifier: sourceValue });
        return;
      }
      const resolved =
        resolution.status === "resolved"
          ? resolution.canonical
          : resolution.status === "unresolved" && resolution.candidate
            ? resolution.candidate
            : null;
      if (!resolved) return;
      if (isIgnored(resolved)) return;

      const fromLayer = layerCache.get(filename);
      // Apply before cross-root and layer classification: declarations cannot
      // bypass this policy through a permitted root or an unclassified file.
      const globalPolicy = options.globals?.localImports ?? "allow";
      if (fromLayer?.role === "global" && (globalPolicy === "forbid" || (globalPolicy === "type-only" && !typeOnly))) {
        const relative = path.relative(rootDir, resolved);
        const local =
          !toPosix(resolved).split("/").includes("node_modules") &&
          (sourceValue.startsWith(".") ||
            path.isAbsolute(sourceValue) ||
            (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)));
        if (local) {
          reportInvalid(context, node, "invalidGlobalLocalImport", { policy: globalPolicy });
          return;
        }
      }
      if (options.roots) {
        const fromRoot = rootForPath(filename, rootDir, options.roots);
        const toRoot = rootForPath(resolved, rootDir, options.roots);
        if (fromRoot && toRoot && fromRoot !== toRoot) {
          if (!(options.dependencies ?? []).includes(toRoot)) {
            reportInvalid(context, node, "invalidRootImport", { fromRoot, toRoot });
            return;
          }
          const target = options.roots[toRoot];
          const dirs = getLayerDirs(toRoot, target.layerDirs, target.layers);
          const targetLayers = getLayers(toRoot, target.layerDirs, target.layers);
          const layer = getLayerForPath(resolved, rootDir, targetLayers);
          const module = getModuleContext(resolved, rootDir, dirs.modules, Boolean(target.singleFileModules));
          const relative = toPosix(path.relative(rootDir, resolved));
          const transit = getTransitModuleInfo(relative, dirs.modules, new Set(target.transitModules ?? []));
          const publicApi = transit
            ? transit.type === "submodule" &&
              isPublicTransitSubmoduleImport(resolved, transit, rootDir, target.publicEntries)
            : module &&
              !module.isSubmodule &&
              (module.isSingleFile || isPublicModuleImport(resolved, module, rootDir, target.publicEntries));
          if (
            layer?.role !== "modules" ||
            !publicApi ||
            (target.modulePages && getModulePagesInfo(relative, dirs.modules))
          ) {
            reportInvalid(context, node, "crossRootPublicOnly", { toRoot });
          } else if (fromLayer?.role === "common") {
            reportInvalid(context, node, "invalidLayerImport", { fromLayer: fromLayer.name, toLayer: layer.name });
          }
          return;
        }
      }
      const toLayer = layerCache.get(resolved);
      if (!fromLayer || !toLayer) return;

      const pageLayer = layers.find(layer => layer.role === "pages");
      const modulePagesEnabled =
        Boolean(options.modulePages) && Boolean(pageLayer) && layers.some(layer => layer.role === "modules");
      const fromRelative = toPosix(path.relative(rootDir, filename));
      const toRelative = toPosix(path.relative(rootDir, resolved));
      const fromModulePages = modulePagesEnabled ? modulePagesCache.get(fromRelative) : null;
      const toModulePages = modulePagesEnabled ? modulePagesCache.get(toRelative) : null;
      const fromLayerName = fromModulePages ? (pageLayer?.name ?? fromLayer.name) : fromLayer.name;
      const allowed = (fromModulePages ? pageLayer : fromLayer)?.imports ?? [];

      if (toLayer.role === "pages" && !allowed.includes(toLayer.name)) {
        if (fromLayer.role === "pages" && isOwnPageStyle(fromRelative, toRelative)) return;
        reportInvalid(context, node, "pagesImportRestricted", {
          fromLayer: fromLayerName,
        });
        return;
      }

      if (toLayer.role === "app" && !allowed.includes(toLayer.name)) {
        reportInvalid(context, node, "appImportRestricted", {
          fromLayer: fromLayerName,
        });
        return;
      }

      if (toModulePages) {
        const fromModuleIndex = moduleIndexCache.get(fromRelative);
        if (fromModuleIndex === toModulePages.moduleName) {
          return;
        }
        reportInvalid(context, node, "modulePagesImportRestricted", {});
        return;
      }

      const resolvedRelative = toPosix(path.relative(rootDir, resolved));
      const transitTarget = transitCache.get(resolvedRelative);
      let skipModuleCheck = false;
      if (transitTarget) {
        const transitImporter = transitCache.get(fromRelative);
        if (transitTarget.type === "private") {
          if (!isAllowedTransitPrivateImport(transitImporter, transitTarget)) {
            reportInvalid(context, node, "invalidTransitPrivateImport", {});
            return;
          }
        } else if (
          !isSameTransitSubmodule(transitImporter, transitTarget) &&
          !isPublicTransitSubmoduleImport(resolved, transitTarget, rootDir, options.publicEntries)
        ) {
          reportInvalid(context, node, "invalidTransitSubmoduleImport", {});
          return;
        }
        skipModuleCheck = true;
      }

      const fromModule = moduleCache.get(filename);
      const toModule = moduleCache.get(resolved);
      if (!skipModuleCheck && toModule) {
        const access = moduleAccess(fromModule, toModule, options.submodules);
        if (access === "forbidden") {
          reportInvalid(context, node, "privateSubmodule", { toName: formatModuleName(toModule) });
          return;
        }
        if (access === "public" && !isPublicModuleImport(resolved, toModule, rootDir, options.publicEntries)) {
          reportInvalid(context, node, "invalidModuleImport", {
            fromName: fromModule ? formatModuleName(fromModule) : fromLayerName,
            toName: formatModuleName(toModule),
          });
          return;
        }
      }

      if (toLayer.role === "global" && fromLayer.role !== "global") {
        reportInvalid(context, node, "invalidGlobalImport", {
          fromLayer: fromLayerName,
        });
        return;
      }
      if (!allowed.includes(toLayer.name)) {
        reportInvalid(context, node, "invalidLayerImport", {
          fromLayer: fromLayerName,
          toLayer: toLayer.name,
        });
      }
    }

    return importListeners(
      context,
      validateImport,
      options.imports?.computed === "forbid"
        ? (node, loader) => reportInvalid(context, node, "computedImport", { loader })
        : undefined,
    );
  },
};

export default rule;
