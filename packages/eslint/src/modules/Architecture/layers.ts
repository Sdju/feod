import path from "node:path";
import { frontendLayers, type LayerSet, type LayerRole } from "../Layers/index.js";

export const layerSetSchema = {
  type: "object",
  minProperties: 1,
  propertyNames: { type: "string", minLength: 1 },
  additionalProperties: {
    type: "object",
    additionalProperties: false,
    required: ["imports"],
    properties: {
      dir: { type: "string", minLength: 1, pattern: "^(?![/\\\\]|[A-Za-z]:)" },
      imports: { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true },
      role: { enum: ["app", "pages", "modules", "common", "global"] },
    },
  },
};

export type Layer = { name: string; dir: string; imports: readonly string[]; role?: LayerRole };

export function getLayers(srcRoot: string, overrides?: LayerDirs, definitions: LayerSet = frontendLayers): Layer[] {
  return Object.entries(definitions)
    .map(([name, definition]) => ({
      name,
      role: definition.role,
      imports: definition.imports,
      dir: path.posix.join(srcRoot, (definition.role && overrides?.[definition.role]) ?? definition.dir ?? name),
    }))
    .sort((a, b) => b.dir.length - a.dir.length);
}

import type { LayerAliases, LayerDirs } from "@o-feod/config";
export type { LayerAliases, LayerDirs };

const DEFAULT_LAYER_DIRS: Required<LayerDirs> = {
  app: "app",
  pages: "pages",
  modules: "modules",
  common: "common",
  global: "global",
};

export function getLayerDirs(srcRoot: string, overrides?: LayerDirs, definitions: LayerSet = frontendLayers) {
  const dirs = { ...DEFAULT_LAYER_DIRS, ...overrides };
  for (const [name, definition] of Object.entries(definitions)) {
    if (definition.role) dirs[definition.role] = overrides?.[definition.role] ?? definition.dir ?? name;
  }
  return {
    app: path.posix.join(srcRoot, dirs.app),
    pages: path.posix.join(srcRoot, dirs.pages),
    modules: path.posix.join(srcRoot, dirs.modules),
    common: path.posix.join(srcRoot, dirs.common),
    global: path.posix.join(srcRoot, dirs.global),
  };
}

export function getLayerAliases(layerDirs: ReturnType<typeof getLayerDirs>, overrides?: LayerAliases) {
  const defaults: LayerAliases = {
    "@app": layerDirs.app,
    "@pages": layerDirs.pages,
    "@modules": layerDirs.modules,
    "@common": layerDirs.common,
    "@global": layerDirs.global,
  };
  return { ...defaults, ...overrides };
}
