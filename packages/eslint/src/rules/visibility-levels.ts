import { createIgnoreMatcher } from "../common/ignore.js";
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

type LevelVisibility = "default" | "transparent" | "open";

type LevelConfig = {
  name: string;
  visibility: LevelVisibility;
  maxDepth?: number;
};

type Options = {
  rootDir?: string;
  levels?: LevelConfig[];
  srcRoot?: string;
  aliasPrefix?: string;
  aliasRoot?: string;
  layerAliases?: LayerAliases;
  layerDirs?: LayerDirs;
  ignore?: string | string[];
};

function toPosix(value: string) {
  return value.replace(/\\/g, "/");
}

function normalizeFilename(filename: string, rootDir: string) {
  if (!filename || filename.startsWith("<")) return null;
  if (path.isAbsolute(filename)) return filename;
  return path.resolve(rootDir, filename);
}

function findLevelIndex(parts: string[], levelName: string) {
  return parts.indexOf(levelName);
}

function startsWithSegments(pathParts: string[], prefix: string[]) {
  if (prefix.length > pathParts.length) return false;
  return prefix.every((segment, index) => pathParts[index] === segment);
}

function reportInvalid(context: Rule.RuleContext, node: unknown, level: LevelConfig, maxDepth: number) {
  context.report({
    node: node as Rule.Node,
    messageId: "visibilityDepth",
    data: { level: level.name, maxDepth: String(maxDepth) },
  });
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce visibility levels by limiting import depth",
    },
    schema: [
      {
        type: "object",
        properties: {
          rootDir: { type: "string" },
          srcRoot: { type: "string" },
          aliasPrefix: { type: "string" },
          aliasRoot: { type: "string" },
          layerAliases: { type: "object", additionalProperties: { type: "string" } },
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
          levels: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                visibility: {
                  type: "string",
                  enum: ["default", "transparent", "open"],
                },
                maxDepth: { type: "number", minimum: 0 },
              },
              required: ["name", "visibility"],
              additionalProperties: false,
            },
          },
          ignore: {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      visibilityDepth: "FEOD: level '{{level}}' allows only depth={{maxDepth}} from outside.",
    },
  },
  create(context) {
    const options = (context.options[0] || {}) as Options;
    const rootDir = path.resolve(options.rootDir || process.cwd());
    const levels = options.levels || [];
    const srcRoot = options.srcRoot || "src";
    const layerAliases = getLayerAliases(getLayerDirs(srcRoot, options.layerDirs), options.layerAliases);
    const transparentNames = new Set(levels.filter(lvl => lvl.visibility === "transparent").map(lvl => lvl.name));
    const filename = normalizeFilename(getFilename(context), rootDir);
    const isIgnored = createIgnoreMatcher(options.ignore, rootDir);

    if (!filename || levels.length === 0 || isIgnored(filename)) {
      return {};
    }

    const fromParts = toPosix(path.relative(rootDir, filename)).split("/");

    function validateImport(node: unknown, sourceValue: unknown) {
      if (!filename) return;
      const resolved = resolveImportPath(sourceValue, context, filename, {
        rootDir,
        srcRoot,
        aliasPrefix: options.aliasPrefix || "@",
        aliasRoot: options.aliasRoot || srcRoot,
        layerAliases,
      });
      if (!resolved) return;
      if (isIgnored(resolved)) return;

      const toParts = toPosix(path.relative(rootDir, resolved)).split("/");

      for (const level of levels) {
        if (level.visibility === "open") {
          continue;
        }
        const index = findLevelIndex(toParts, level.name);
        if (index === -1) {
          continue;
        }

        const levelRoot = toParts.slice(0, index + 1);
        if (startsWithSegments(fromParts, levelRoot)) {
          continue;
        }

        const maxDepth = typeof level.maxDepth === "number" ? level.maxDepth : level.visibility === "default" ? 1 : 0;

        const afterLevel = toParts.slice(index + 1);
        const depth = afterLevel.filter(segment => !transparentNames.has(segment)).length;
        if (depth > maxDepth) {
          reportInvalid(context, node, level, maxDepth);
          return;
        }
      }
    }

    return importListeners(context, validateImport);
  },
};

export default rule;
