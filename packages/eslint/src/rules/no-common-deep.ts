import { createIgnoreMatcher } from "../common/ignore.js";
import path from "node:path";
import type { Rule } from "eslint";

import { getFilename, type LayerDirs, getLayerDirs } from "../modules/Architecture/index.js";

type Options = {
  rootDir?: string;
  maxDepth?: number;
  ignore?: string | string[];
  srcRoot?: string;
  layerDirs?: LayerDirs;
};

function toPosix(value: string) {
  return value.replace(/\\/g, "/");
}

function normalizeFilename(filename: string, rootDir: string) {
  if (!filename || filename.startsWith("<")) return null;
  if (path.isAbsolute(filename)) return filename;
  return path.resolve(rootDir, filename);
}

function getCommonDepth(relativePath: string, commonDir: string) {
  if (!relativePath.startsWith(`${commonDir}/`)) return null;
  const parts = relativePath.split("/");
  const prefixParts = commonDir.split("/");
  if (parts.length <= prefixParts.length + 1) return 0;
  return Math.max(parts.length - (prefixParts.length + 1), 0);
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow deep nesting in common layer",
    },
    schema: [
      {
        type: "object",
        properties: {
          rootDir: { type: "string" },
          maxDepth: { type: "number", minimum: 0 },
          ignore: {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
          },
          srcRoot: { type: "string" },
          layerDirs: {
            type: "object",
            properties: {
              common: { type: "string" },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      commonTooDeep: "FEOD: common nesting exceeds maxDepth={{maxDepth}}.",
    },
  },
  create(context) {
    const options = (context.options[0] || {}) as Options;
    const rootDir = path.resolve(options.rootDir || process.cwd());
    const srcRoot = options.srcRoot || "src";
    const layerDirs = getLayerDirs(srcRoot, options.layerDirs);
    const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth! : 1;
    const filename = normalizeFilename(getFilename(context), rootDir);
    const isIgnored = createIgnoreMatcher(options.ignore, rootDir);

    if (!filename || isIgnored(filename)) {
      return {};
    }

    const relative = toPosix(path.relative(rootDir, filename));
    const depth = getCommonDepth(relative, layerDirs.common);
    if (depth !== null && depth > maxDepth) {
      return {
        Program(node) {
          context.report({
            node,
            messageId: "commonTooDeep",
            data: { maxDepth: String(maxDepth) },
          });
        },
      };
    }

    return {};
  },
};

export default rule;
