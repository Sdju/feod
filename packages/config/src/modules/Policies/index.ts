/** Types and small constants of the portable FEOD configuration; no rule logic lives here. */

export type SubmodulePolicy = {
  visibility?: "public" | "parent-only";
  parentImports?: "public" | "implementation";
  childImportsParent?: "public" | "implementation";
};

export type ImportPolicy = {
  computed?: "ignore" | "forbid";
  unresolved?: "ignore" | "forbid";
};

export type GlobalFilesPolicy = {
  allowedFiles?: string[];
  localImports?: "allow" | "type-only" | "forbid";
};
export type ModuleNamesPolicy = { forbiddenNames?: string[] };
export type ModulePolicy = ModuleNamesPolicy & {
  publicEntries?: string[];
  requirePublicEntry?: boolean;
};

export type InventoryPolicy = {
  uncovered?: boolean;
};

export type CyclesPolicy = {
  /** Detect value-import cycles between module owners (Projector-style module graph). */
  modules?: boolean;
  /** Detect value-import cycles between source files across FEOD layers. */
  files?: boolean;
  /** `include`: module cycles also count type-only imports (except into an ancestor module). */
  types?: "ignore" | "include";
};

export type LayerDirs = {
  app?: string;
  pages?: string;
  modules?: string;
  common?: string;
  global?: string;
};

export type LayerAliases = Record<string, string>;

export type LargeFileEntry = {
  /** Highest accepted line count; it only goes down. */
  ceiling: number;
  /** How the file is going to be split. */
  plan: string;
};
export type LargeFilesPolicy = {
  /** Line limits by extension (".vue") with a required-by-default "default". */
  thresholds?: Record<string, number>;
  /** Registered oversized files by project-relative POSIX path. */
  files?: Record<string, LargeFileEntry>;
};
export const DEFAULT_LARGE_FILE_LIMIT = 400;

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

export function confineProblem(policy: ConfinePolicy): string | undefined {
  const names = new Set<string>();
  for (const [index, entry] of policy.entries()) {
    if (names.has(entry.name)) return `/${index}/name: duplicate confine name '${entry.name}'`;
    names.add(entry.name);
    if (!entry.imports?.length && !entry.targets?.length && !entry.literals?.length)
      return `/${index}: '${entry.name}' needs imports, targets or literals`;
    for (const source of entry.literals ?? []) {
      try {
        new RegExp(source);
      } catch (error) {
        return `/${index}/literals: invalid regular expression '${source}': ${(error as Error).message}`;
      }
    }
  }
  return undefined;
}
