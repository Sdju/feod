import { createPathMemoizer } from "../common/cache.js";
import { createIgnoreMatcher } from "../common/ignore.js";
import path from "node:path";
import type { Rule } from "eslint";

import {
  getModuleContext,
  isPublicModuleImport,
  getTransitModuleInfo,
  isPublicTransitSubmoduleImport,
  publicEntriesSchema,
  formatModuleName,
  type ModuleContext,
  getFilename,
  importListeners,
  type LayerAliases,
  type LayerDirs,
  getLayerAliases,
  getLayerDirs,
  resolveImportPath,
} from "../modules/Architecture/index.js";

type Options = {
  publicEntries?: string[];
  transitModules?: string[];
  rootDir?: string;
  aliasPrefix?: string;
  aliasRoot?: string;
  ignore?: string | string[];
  srcRoot?: string;
  layerDirs?: LayerDirs;
  layerAliases?: LayerAliases;
};

function normalizeFilename(filename: string, rootDir: string) {
  if (!filename || filename.startsWith("<")) return null;
  if (path.isAbsolute(filename)) return filename;
  return path.resolve(rootDir, filename);
}

function reportInvalid(
  context: Rule.RuleContext,
  node: unknown,
  data: Record<string, string>
) {
  context.report({
    node: node as Rule.Node,
    messageId: "zigzagImport",
    data,
  });
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow zig-zag relative imports between modules",
    },
    schema: [
      {
        type: "object",
        properties: {
          publicEntries: publicEntriesSchema,
          transitModules: { type: "array", items: { type: "string" } },
          rootDir: { type: "string" },
          aliasPrefix: { type: "string" },
          aliasRoot: { type: "string" },
          ignore: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          srcRoot: { type: "string" },
          layerDirs: {
            type: "object",
            properties: {
              modules: { type: "string" },
            },
            additionalProperties: false,
          },
          layerAliases: {
            type: "object",
            additionalProperties: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      zigzagImport:
        "FEOD: '{{from}}' cannot zig-zag import from '{{to}}'. Use public API.",
    },
  },
  create(context) {
    const options = (context.options[0] || {}) as Options;
    const rootDir = path.resolve(options.rootDir || process.cwd());
    const srcRoot = options.srcRoot || "src";
    const layerDirs = getLayerDirs(srcRoot, options.layerDirs);
    const layerAliases = getLayerAliases(layerDirs, options.layerAliases);
    const aliasPrefix = options.aliasPrefix || "@";
    const aliasRoot = options.aliasRoot || srcRoot;
    const filename = normalizeFilename(getFilename(context), rootDir);
    const isIgnored = createIgnoreMatcher(options.ignore, rootDir);

    if (!filename || isIgnored(filename)) {
      return {};
    }

    const moduleCache = createPathMemoizer((filePath) =>
      getModuleContext(filePath, rootDir, layerDirs.modules)
    );
    const fromModuleContext = moduleCache.get(filename);
    if (!fromModuleContext) {
      return {};
    }
    const fromModule: ModuleContext = fromModuleContext;
    const transitModules = new Set(options.transitModules ?? []);

    function validateImport(node: unknown, sourceValue: unknown) {
      if (
        !filename ||
        typeof sourceValue !== "string" ||
        !sourceValue.startsWith(".")
      ) return;
      const resolved = resolveImportPath(sourceValue, context, filename, {
        rootDir,
        aliasPrefix,
        aliasRoot,
        srcRoot,
        layerAliases,
      });
      if (!resolved) return;
      if (isIgnored(resolved)) return;

      const toModule = moduleCache.get(resolved);
      if (!toModule) return;

      // Preserve this rule's relative cross-top-level scope. Nested access
      // policy belongs to layer-imports; ownership and public entries are shared.
      const transit = getTransitModuleInfo(path.relative(rootDir, resolved).replace(/\\/g, "/"), layerDirs.modules, transitModules);
      const publicImport = transit
        ? transit.type === "submodule" && isPublicTransitSubmoduleImport(resolved, transit, rootDir, options.publicEntries)
        : isPublicModuleImport(resolved, toModule, rootDir, options.publicEntries);
      if (fromModule.moduleRoot !== toModule.moduleRoot && !publicImport) {
        reportInvalid(context, node, {
          from: formatModuleName(fromModule),
          to: formatModuleName(toModule),
        });
      }
    }

    return importListeners(context, validateImport);
  },
};

export default rule;
