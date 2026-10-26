import { createIgnoreMatcher } from "../common/ignore.js";
import path from "node:path";
import type { Rule } from "eslint";

import {
  getFilename,
  getFileGraph,
  reportInventoryOnce,
  layerSetSchema,
  type LayerDirs,
} from "../modules/Architecture/index.js";

import type { LayerSet } from "../modules/Layers/index.js";

type Options = {
  enabled?: boolean;
  rootDir?: string;
  srcRoot?: string;
  ignore?: string | string[];
  layers?: LayerSet;
  layerDirs?: LayerDirs;
  layerAliases?: Record<string, string>;
  aliasPrefix?: string;
  aliasRoot?: string;
  singleFileModules?: boolean;
  transitModules?: string[];
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Disallow value-import cycles between source files" },
    schema: [{
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean" },
        rootDir: { type: "string" },
        srcRoot: { type: "string" },
        ignore: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
        layers: layerSetSchema,
        layerDirs: {
          type: "object",
          additionalProperties: false,
          properties: {
            app: { type: "string" },
            pages: { type: "string" },
            modules: { type: "string" },
            common: { type: "string" },
            global: { type: "string" },
          },
        },
        layerAliases: { type: "object", additionalProperties: { type: "string" } },
        aliasPrefix: { type: "string" },
        aliasRoot: { type: "string" },
        singleFileModules: { type: "boolean" },
        transitModules: { type: "array", items: { type: "string" } },
      },
    }],
    messages: {
      fileCycle: "FEOD: file dependency cycle: {{cycle}}.",
    },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as Options;
    if (options.enabled === false) return {};
    const filename = getFilename(context);
    if (!filename || filename.startsWith("<")) return {};
    const rootDir = path.resolve(options.rootDir ?? process.cwd());
    const absolute = path.resolve(rootDir, filename);
    if (createIgnoreMatcher(options.ignore, rootDir)(absolute)) return {};

    const srcRoot = options.srcRoot ?? "src";
    const graph = getFileGraph({
      rootDir,
      srcRoot,
      layers: options.layers,
      layerDirs: options.layerDirs,
      ignore: options.ignore,
      singleFileModules: options.singleFileModules,
      transitModules: options.transitModules,
      aliasPrefix: options.aliasPrefix,
      aliasRoot: options.aliasRoot,
      layerAliases: options.layerAliases,
    });
    if (!graph.cycles.length) return {};

    return {
      Program(node) {
        for (const cycle of graph.cycles) {
          const id = cycle.nodes.join("->");
          reportInventoryOnce(`no-file-cycles:${rootDir}:${graph.srcRoot}:${id}`, () => {
            context.report({
              node,
              messageId: "fileCycle",
              data: { cycle: cycle.labels.join(" -> ") },
            });
          });
        }
      },
    };
  },
};

export default rule;
