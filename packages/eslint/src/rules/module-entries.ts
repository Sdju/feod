import { createIgnoreMatcher } from "../common/ignore.js";
import path from "node:path";
import type { Rule } from "eslint";

import {
  getFilename,
  getInventory,
  reportInventoryOnce,
  layerSetSchema,
  type LayerDirs,
  publicEntriesSchema,
} from "../modules/Architecture/index.js";

import type { LayerSet } from "../modules/Layers/index.js";

type Options = {
  requirePublicEntry?: boolean;
  rootDir?: string;
  srcRoot?: string;
  ignore?: string | string[];
  layers?: LayerSet;
  layerDirs?: LayerDirs;
  singleFileModules?: boolean;
  transitModules?: string[];
  publicEntries?: string[];
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Require a public entry file for each module owner discovered on disk" },
    schema: [{
      type: "object",
      additionalProperties: false,
      properties: {
        requirePublicEntry: { type: "boolean" },
        rootDir: { type: "string" },
        srcRoot: { type: "string" },
        ignore: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
        layers: layerSetSchema,
        layerDirs: { type: "object", additionalProperties: false, properties: { modules: { type: "string" } } },
        singleFileModules: { type: "boolean" },
        transitModules: { type: "array", items: { type: "string" } },
        publicEntries: publicEntriesSchema,
      },
    }],
    messages: {
      missingPublicEntry: "FEOD: module '{{module}}' is missing a public entry ({{expected}}).",
    },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as Options;
    if (!options.requirePublicEntry) return {};
    const filename = getFilename(context);
    if (!filename || filename.startsWith("<")) return {};
    const rootDir = path.resolve(options.rootDir ?? process.cwd());
    const absolute = path.resolve(rootDir, filename);
    if (createIgnoreMatcher(options.ignore, rootDir)(absolute)) return {};

    const inventory = getInventory({
      rootDir,
      srcRoot: options.srcRoot ?? "src",
      layers: options.layers,
      layerDirs: options.layerDirs,
      ignore: options.ignore,
      singleFileModules: options.singleFileModules,
      transitModules: options.transitModules,
      publicEntries: options.publicEntries,
    });
    const expected = options.publicEntries?.length
      ? options.publicEntries.join(" | ")
      : "index.*";
    const transit = new Set(options.transitModules);
    // A transit container has no public API of its own; its submodules carry the entries.
    const missing = inventory.modules.filter(module => module.kind !== "single-file" && !module.hasPublicEntry
      && !(module.depth === 0 && transit.has(module.moduleName)));
    if (!missing.length) return {};

    return {
      Program(node) {
        for (const module of missing) {
          reportInventoryOnce(`module-entries:${rootDir}:${inventory.srcRoot}:${module.ownerRoot}`, () => {
            context.report({
              node,
              messageId: "missingPublicEntry",
              data: { module: module.ownerRoot, expected },
            });
          });
        }
      },
    };
  },
};

export default rule;
