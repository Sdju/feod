import path from "node:path";

import type { SubmodulePolicy } from "@o-feod/config";
export type { SubmodulePolicy };

export const submodulePolicySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    visibility: { enum: ["public", "parent-only"], default: "public" },
    parentImports: { enum: ["public", "implementation"], default: "public" },
    childImportsParent: { enum: ["public", "implementation"], default: "implementation" },
  },
};

export type ModuleContext = {
  moduleName: string;
  submoduleName?: string;
  isSubmodule: boolean;
  isSingleFile: boolean;
  moduleRoot: string;
  submoduleRoot?: string;
  ownerRoot: string;
  parentRoot?: string;
  depth: number;
};

export function getModuleContext(
  filePath: string,
  rootDir: string,
  modulesDir: string,
  allowSingleFile = false,
): ModuleContext | null {
  const relative = path.relative(rootDir, filePath).replace(/\\/g, "/");
  const prefix = `${modulesDir}/`;
  if (!relative.startsWith(prefix)) return null;
  const parts = relative.slice(prefix.length).split("/");
  const moduleName = parts[0];
  if (!moduleName) return null;
  if (parts.length === 1 && path.posix.extname(moduleName)) {
    if (!allowSingleFile) return null;
    const ownerRoot = `${modulesDir}/${moduleName}`;
    return {
      moduleName: path.posix.parse(moduleName).name,
      isSubmodule: false,
      isSingleFile: true,
      moduleRoot: ownerRoot,
      ownerRoot,
      depth: 0,
    };
  }
  const moduleRoot = `${modulesDir}/${moduleName}`;
  let ownerRoot = moduleRoot;
  let parentRoot: string | undefined;
  let depth = 0;
  for (let cursor = 1; parts[cursor] === "modules" && parts[cursor + 1]; cursor += 2) {
    parentRoot = ownerRoot;
    ownerRoot += `/modules/${parts[cursor + 1]}`;
    depth += 1;
  }
  return {
    moduleName,
    isSingleFile: false,
    moduleRoot,
    ownerRoot,
    parentRoot,
    depth,
    isSubmodule: depth > 0,
    submoduleRoot: depth ? ownerRoot : undefined,
    submoduleName: depth ? ownerRoot.slice(moduleRoot.length + "/modules/".length) : undefined,
  };
}

export const publicEntriesSchema = {
  type: "array",
  uniqueItems: true,
  items: { type: "string", minLength: 1, pattern: "^(?!\\.{1,2}$)[^/\\\\*?\\[\\]{}]+$" },
};

/** Empty entries preserve index.* matching; directory shorthand stays supported. */
export function isPublicEntryImport(
  resolvedPath: string,
  ownerRoot: string,
  rootDir: string,
  entries: readonly string[] = [],
) {
  const root = path.join(rootDir, ownerRoot);
  const normalized = path.normalize(resolvedPath);
  if (normalized === root) return true;
  if (path.dirname(normalized) !== root) return false;
  const name = path.basename(normalized);
  return entries.length ? entries.includes(name) : name === "index" || name.startsWith("index.");
}

export function isPublicModuleImport(
  resolvedPath: string,
  target: ModuleContext,
  rootDir: string,
  entries?: readonly string[],
) {
  return isPublicEntryImport(resolvedPath, target.ownerRoot, rootDir, entries);
}

export function formatModuleName(context: ModuleContext) {
  return context.isSubmodule && context.submoduleName
    ? `${context.moduleName}/modules/${context.submoduleName}`
    : context.moduleName;
}

/** Access between nearest owners; transit modules retain their separate policy. */
export function moduleAccess(from: ModuleContext | null, to: ModuleContext, policy: SubmodulePolicy = {}) {
  if (from?.ownerRoot === to.ownerRoot) return "implementation";
  const parentToChild = from !== null && from.ownerRoot === to.parentRoot;
  const childToParent = from !== null && from.parentRoot === to.ownerRoot;
  if (policy.visibility === "parent-only" && to.isSubmodule && !parentToChild && !childToParent) return "forbidden";
  if (
    (parentToChild && policy.parentImports === "implementation") ||
    (childToParent && (policy.childImportsParent ?? "implementation") === "implementation")
  )
    return "implementation";
  return "public";
}

type TransitType = "submodule" | "private";

export type TransitInfo = {
  moduleName: string;
  type: TransitType;
  submoduleName?: string;
  submoduleRoot?: string;
  privateRoot?: string;
};

export function getTransitModuleInfo(
  relativePath: string,
  modulesDir: string,
  transitModules: Set<string>,
): TransitInfo | null {
  if (!transitModules.size) return null;
  if (!relativePath.startsWith(`${modulesDir}/`)) return null;
  const rest = relativePath.slice(modulesDir.length + 1);
  if (!rest) return null;
  const parts = rest.split("/");
  const moduleName = parts[0];
  if (!moduleName || !transitModules.has(moduleName)) return null;
  const second = parts[1];
  if (!second || second === "modules") return null;
  if (second === "_") {
    return {
      moduleName,
      type: "private",
      privateRoot: `${modulesDir}/${moduleName}/_`,
    };
  }
  return {
    moduleName,
    type: "submodule",
    submoduleName: second,
    submoduleRoot: `${modulesDir}/${moduleName}/${second}`,
  };
}

export function isPublicTransitSubmoduleImport(
  resolvedPath: string,
  target: TransitInfo,
  rootDir: string,
  entries?: readonly string[],
) {
  return Boolean(target.submoduleRoot && isPublicEntryImport(resolvedPath, target.submoduleRoot, rootDir, entries));
}
