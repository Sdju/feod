import { confineProblem, type ConfineEntry, type ConfinePolicy } from "@o-feod/config";
export { confineProblem };
export type { ConfineEntry, ConfinePolicy };

export const confineSchema = {
  type: "array",
  uniqueItems: true,
  items: {
    type: "object",
    additionalProperties: false,
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1 },
      imports: { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true },
      targets: { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true },
      literals: { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true },
      allowedIn: { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true },
      allowTypeImports: { type: "boolean", default: false },
      message: { type: "string", minLength: 1 },
    },
  },
};

/** Name of the first invalid entry or regular expression, for configuration errors. */
