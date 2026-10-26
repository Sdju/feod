export type ConfineEntry = {
  /** Unique label shown in diagnostics. */
  name: string;
  /** Picomatch globs matched against import specifiers exactly as written. */
  imports?: string[];
  /** Picomatch globs, relative to the project root, matched against the resolved file of a local import. */
  targets?: string[];
  /** Regular expression sources tested against static string literals. */
  literals?: string[];
  /** Picomatch globs, relative to the project root, of files allowed to match. */
  allowedIn?: string[];
  /** Ignore type-only imports for `imports` patterns. */
  allowTypeImports?: boolean;
  /** Replaces the default explanation in diagnostics. */
  message?: string;
};
export type ConfinePolicy = ConfineEntry[];

export const confineSchema = {
  type: "array", uniqueItems: true,
  items: {
    type: "object", additionalProperties: false, required: ["name"],
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
export function confineProblem(policy: ConfinePolicy): string | undefined {
  const names = new Set<string>();
  for (const [index, entry] of policy.entries()) {
    if (names.has(entry.name)) return `/${index}/name: duplicate confine name '${entry.name}'`;
    names.add(entry.name);
    if (!entry.imports?.length && !entry.targets?.length && !entry.literals?.length) return `/${index}: '${entry.name}' needs imports, targets or literals`;
    for (const source of entry.literals ?? []) {
      try { new RegExp(source); } catch (error) {
        return `/${index}/literals: invalid regular expression '${source}': ${(error as Error).message}`;
      }
    }
  }
  return undefined;
}
