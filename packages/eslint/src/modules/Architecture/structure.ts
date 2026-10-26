import { publicEntriesSchema } from "./modules.js";

export type GlobalFilesPolicy = {
  allowedFiles?: string[];
  localImports?: "allow" | "type-only" | "forbid";
};
export type ModuleNamesPolicy = { forbiddenNames?: string[] };

export const globalFilesSchema = {
  type: "object", additionalProperties: false,
  properties: {
    allowedFiles: { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true },
    localImports: { enum: ["allow", "type-only", "forbid"], default: "allow" },
  },
};
export const moduleNamesSchema = {
  type: "object", additionalProperties: false,
  properties: { forbiddenNames: { type: "array", items: { type: "string", minLength: 1, pattern: "^[^/\\\\]+$" }, uniqueItems: true } },
};

export type ModulePolicy = ModuleNamesPolicy & {
  publicEntries?: string[];
  requirePublicEntry?: boolean;
};
export const modulePolicySchema = {
  ...moduleNamesSchema,
  properties: {
    ...moduleNamesSchema.properties,
    publicEntries: publicEntriesSchema,
    requirePublicEntry: { type: "boolean", default: false },
  },
};

export type InventoryPolicy = {
  uncovered?: boolean;
};
export const inventoryPolicySchema = {
  type: "object", additionalProperties: false,
  properties: {
    uncovered: { type: "boolean", default: false },
  },
};

export type CyclesPolicy = {
  /** Detect value-import cycles between module owners (Projector-style module graph). */
  modules?: boolean;
  /** Detect value-import cycles between source files across FEOD layers. */
  files?: boolean;
  /** `include`: module cycles also count type-only imports (except into an ancestor module). */
  types?: "ignore" | "include";
};
export const cyclesPolicySchema = {
  type: "object", additionalProperties: false,
  properties: {
    modules: { type: "boolean", default: false },
    files: { type: "boolean", default: false },
    types: { enum: ["ignore", "include"], default: "ignore" },
  },
};
