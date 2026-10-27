import { createPathMemoizer } from "../common/cache.js";
import { createIgnoreMatcher } from "../common/ignore.js";
import path from "node:path";
import type { Rule } from "eslint";

import {
  getFilename,
  getInventory,
  reportInventoryOnce,
  type LayerDirs,
  getLayers,
  layerSetSchema,
  type Layer,
} from "../modules/Architecture/index.js";

import type { LayerSet } from "../modules/Layers/index.js";

type Options = {
  layers?: LayerSet;
  rootDir?: string;
  ignore?: string | string[];
  srcRoot?: string;
  layerDirs?: LayerDirs;
  /** When true, report uncovered files discovered by filesystem inventory once per run. */
  filesystem?: boolean;
};

function toPosix(value: string) {
  return value.replace(/\\/g, "/");
}

function normalizeFilename(filename: string, rootDir: string) {
  if (!filename || filename.startsWith("<")) return null;
  if (path.isAbsolute(filename)) return filename;
  return path.resolve(rootDir, filename);
}

function isKnownPath(relativePath: string, layers: Layer[]) {
  return layers.some(layer => relativePath === layer.dir || relativePath.startsWith(`${layer.dir}/`));
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow files outside FEOD known layers",
    },
    schema: [
      {
        type: "object",
        properties: {
          layers: layerSetSchema,
          rootDir: { type: "string" },
          ignore: {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
          },
          srcRoot: { type: "string" },
          filesystem: { type: "boolean" },
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
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unknownFile: "FEOD: file is outside known FEOD layers.",
      unknownInventoryFile: "FEOD: file '{{file}}' is outside known FEOD layers.",
    },
  },
  create(context) {
    const options = (context.options[0] || {}) as Options;
    const rootDir = path.resolve(options.rootDir || process.cwd());
    const srcRoot = options.srcRoot || "src";
    const layers = getLayers(srcRoot, options.layerDirs, options.layers);
    const filename = normalizeFilename(getFilename(context), rootDir);
    const isIgnored = createIgnoreMatcher(options.ignore, rootDir);
    const knownPathCache = createPathMemoizer(relativePath => isKnownPath(relativePath, layers));

    if (!filename || isIgnored(filename)) {
      return {};
    }

    const relative = toPosix(path.relative(rootDir, filename));
    const currentUnknown = !knownPathCache.get(relative);
    const inventory = options.filesystem
      ? getInventory({
          rootDir,
          srcRoot,
          layers: options.layers,
          layerDirs: options.layerDirs,
          ignore: options.ignore,
        })
      : null;
    const inventoryUnknown = inventory?.uncovered.filter(file => file !== relative) ?? [];

    if (!currentUnknown && !inventoryUnknown.length) {
      return {};
    }

    return {
      Program(node) {
        if (currentUnknown) {
          context.report({
            node,
            messageId: "unknownFile",
          });
        }
        for (const file of inventoryUnknown) {
          reportInventoryOnce(`no-unknown-files:${rootDir}:${srcRoot}:${file}`, () => {
            context.report({
              node,
              messageId: "unknownInventoryFile",
              data: { file },
            });
          });
        }
      },
    };
  },
};

export default rule;
