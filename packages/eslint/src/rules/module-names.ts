import { createIgnoreMatcher } from "../common/ignore.js";
import path from "node:path";
import type { Rule } from "eslint";
import {
  getFilename,
  getInventory,
  reportInventoryOnce,
  getLayers,
  layerSetSchema,
  type LayerDirs,
  getModuleContext,
  moduleNamesSchema,
  type ModuleNamesPolicy,
} from "../modules/Architecture/index.js";

import type { LayerSet } from "../modules/Layers/index.js";

type Options = ModuleNamesPolicy & {
  rootDir?: string;
  srcRoot?: string;
  ignore?: string | string[];
  layerDirs?: LayerDirs;
  layers?: LayerSet;
  singleFileModules?: boolean;
  transitModules?: string[];
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem", docs: { description: "Disallow configured names of module owners" },
    schema: [{ type: "object", additionalProperties: false, properties: {
      ...moduleNamesSchema.properties, rootDir: { type: "string" }, srcRoot: { type: "string" },
      ignore: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
      layers: layerSetSchema,
      layerDirs: { type: "object", additionalProperties: false, properties: { modules: { type: "string" } } },
      singleFileModules: { type: "boolean" }, transitModules: { type: "array", items: { type: "string" } },
    } }],
    messages: { forbiddenModuleName: "FEOD: module name '{{name}}' is forbidden by configuration." },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as Options;
    if (!options.forbiddenNames?.length) return {};
    const filename = getFilename(context);
    if (!filename || filename.startsWith("<")) return {};
    const rootDir = path.resolve(options.rootDir ?? process.cwd());
    const absolute = path.resolve(rootDir, filename);
    if (createIgnoreMatcher(options.ignore, rootDir)(absolute)) return {};
    const relative = path.relative(rootDir, absolute).replace(/\\/g, "/");
    const layer = getLayers(options.srcRoot ?? "src", options.layerDirs, options.layers)
      .find(layer => relative.startsWith(`${layer.dir}/`));
    const forbidden = new Set(options.forbiddenNames);
    const visitedViolations = new Set<string>();
    if (layer?.role === "modules") {
      const owner = getModuleContext(absolute, rootDir, layer.dir, options.singleFileModules);
      if (owner) {
        const names = [owner.moduleName, ...owner.submoduleName?.split("/modules/") ?? []];
        const parts = relative.slice(layer.dir.length + 1).split("/");
        // Transit children live directly below the hub; '_' is its private core.
        if (options.transitModules?.includes(owner.moduleName) && parts[1] !== "_" && parts[1] !== "modules" && parts.length > 2) {
          names.push(parts[1]);
          for (let cursor = 2; parts[cursor] === "modules" && parts[cursor + 1]; cursor += 2) names.push(parts[cursor + 1]);
        }
        for (const name of new Set(names)) {
          if (forbidden.has(name)) visitedViolations.add(name);
        }
      }
    }

    const inventory = getInventory({
      rootDir,
      srcRoot: options.srcRoot ?? "src",
      layers: options.layers,
      layerDirs: options.layerDirs,
      ignore: options.ignore,
      singleFileModules: options.singleFileModules,
      transitModules: options.transitModules,
    });
    const inventoryViolations = inventory.modules.flatMap(module =>
      module.names.filter(name => forbidden.has(name)).map(name => ({ name, ownerRoot: module.ownerRoot, emptyOrAsset: module.isEmpty || module.isAssetOnly })),
    );

    if (!visitedViolations.size && !inventoryViolations.some(item => item.emptyOrAsset)) return {};

    return { Program(node) {
      for (const name of visitedViolations) {
        context.report({ node, messageId: "forbiddenModuleName", data: { name } });
      }
      for (const item of inventoryViolations) {
        if (!item.emptyOrAsset || visitedViolations.has(item.name)) continue;
        reportInventoryOnce(`module-names:${rootDir}:${inventory.srcRoot}:${item.ownerRoot}:${item.name}`, () => {
          context.report({ node, messageId: "forbiddenModuleName", data: { name: item.name } });
        });
      }
    } };
  },
};
export default rule;
