import { publicEntriesSchema } from "./modules.js";

import type { CyclesPolicy, GlobalFilesPolicy, InventoryPolicy, ModuleNamesPolicy, ModulePolicy } from "@o-feod/config";
export type { CyclesPolicy, GlobalFilesPolicy, InventoryPolicy, ModuleNamesPolicy, ModulePolicy };

export const globalFilesSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowedFiles: { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true },
    localImports: { enum: ["allow", "type-only", "forbid"], default: "allow" },
  },
};
export const moduleNamesSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    forbiddenNames: {
      type: "array",
      items: { type: "string", minLength: 1, pattern: "^[^/\\\\]+$" },
      uniqueItems: true,
    },
  },
};

export const modulePolicySchema = {
  ...moduleNamesSchema,
  properties: {
    ...moduleNamesSchema.properties,
    publicEntries: publicEntriesSchema,
    requirePublicEntry: { type: "boolean", default: false },
  },
};

export const inventoryPolicySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    uncovered: { type: "boolean", default: false },
  },
};

export const cyclesPolicySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    modules: { type: "boolean", default: false },
    files: { type: "boolean", default: false },
    types: { enum: ["ignore", "include"], default: "ignore" },
  },
};
