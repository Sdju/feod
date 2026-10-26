import { createPathMemoizer } from "../common/cache.js";
import { createIgnoreMatcher } from "../common/ignore.js";
import path from "node:path";
import type { Rule } from "eslint";

import {
  getFilename,
  getModuleContext,
  importListeners,
  type LayerAliases,
  type LayerDirs,
  getLayerAliases,
  getLayerDirs,
  resolveImportPath,
} from "../modules/Architecture/index.js";

type Options = {
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

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Restrict deep submodule imports to their owner and immediate parent/child",
    },
    schema: [
      {
        type: "object",
        properties: {
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
      noSubmoduleOfSubmodule:
        "FEOD: deep submodules are accessible only within their owner or immediate parent/child.",
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

    const moduleCache = createPathMemoizer((file) => getModuleContext(file, rootDir, layerDirs.modules));
    const own = moduleCache.get(filename);

    function validateImport(node: unknown, sourceValue: unknown) {
      if (!filename) return;
      const resolved = resolveImportPath(sourceValue, context, filename, {
        rootDir,
        aliasPrefix,
        aliasRoot,
        srcRoot,
        layerAliases,
      });
      if (!resolved) return;
      if (isIgnored(resolved)) return;

      const target = moduleCache.get(resolved);
      if (target && target.depth > 1 && own?.ownerRoot !== target.ownerRoot &&
          own?.ownerRoot !== target.parentRoot && own?.parentRoot !== target.ownerRoot) {
        context.report({
          node: node as Rule.Node,
          messageId: "noSubmoduleOfSubmodule",
        });
      }
    }

    return importListeners(context, validateImport);
  },
};

export default rule;
