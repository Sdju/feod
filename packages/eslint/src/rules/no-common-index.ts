import { createIgnoreMatcher } from "../common/ignore.js";
import { createPathMemoizer } from "../common/cache.js";
import path from "node:path";
import type { Rule } from "eslint";

import {
  getFilename,
  importListeners,
  resolveImportPath,
  type LayerAliases,
  type LayerDirs,
  getLayerAliases,
  getLayerDirs,
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

function toPosix(value: string) {
  return value.replace(/\\/g, "/");
}

function normalizeFilename(filename: string, rootDir: string) {
  if (!filename || filename.startsWith("<")) return null;
  if (path.isAbsolute(filename)) return filename;
  return path.resolve(rootDir, filename);
}

function isCommonIndexFile(
  filePath: string,
  rootDir: string,
  commonDir: string
) {
  const relative = toPosix(path.relative(rootDir, filePath));
  if (!relative.startsWith(`${commonDir}/`)) return false;
  const base = path.basename(relative);
  return base === "index" || base.startsWith("index.");
}

function reportInvalid(
  context: Rule.RuleContext,
  node: unknown,
  messageId: string
) {
  context.report({
    node: node as Rule.Node,
    messageId,
  });
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow index files in common layer",
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
              common: { type: "string" },
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
      noCommonIndex: "FEOD: common index files are запрещены.",
      noCommonIndexImport: "FEOD: importing common index files is запрещено.",
    },
  },
  create(context) {
    const options = (context.options[0] || {}) as Options;
    const rootDir = path.resolve(options.rootDir || process.cwd());
    const aliasPrefix = options.aliasPrefix || "@";
    const srcRoot = options.srcRoot || "src";
    const aliasRoot = options.aliasRoot || srcRoot;
    const layerDirs = getLayerDirs(srcRoot, options.layerDirs);
    const layerAliases = getLayerAliases(layerDirs, options.layerAliases);
    const filename = normalizeFilename(getFilename(context), rootDir);
    const isIgnored = createIgnoreMatcher(options.ignore, rootDir);
    const commonIndexCache = createPathMemoizer((filePath) =>
      isCommonIndexFile(filePath, rootDir, layerDirs.common)
    );

    if (!filename || isIgnored(filename)) {
      return {};
    }

    if (commonIndexCache.get(filename)) {
      return {
        Program(node) {
          reportInvalid(context, node, "noCommonIndex");
        },
      };
    }

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

      if (commonIndexCache.get(resolved)) {
        reportInvalid(context, node, "noCommonIndexImport");
      }
    }

    return importListeners(context, validateImport);
  },
};

export default rule;
