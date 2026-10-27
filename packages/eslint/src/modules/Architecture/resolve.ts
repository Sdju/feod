import resolverModule from "eslint-module-utils/resolve";
import { builtinModules } from "node:module";
import fs from "node:fs";
import path from "node:path";
import type { Rule } from "eslint";
import type { LayerAliases } from "./layers.js";
import { rootForPath, type RuleRoots } from "./roots.js";

// Native ESM sees the CommonJS exports object; bundlers may unwrap its default.
const eslintResolve =
  typeof resolverModule === "function"
    ? resolverModule
    : (resolverModule as unknown as { default: typeof resolverModule }).default;

const builtins = new Set([...builtinModules, ...builtinModules.map(name => `node:${name}`)]);

const FILE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".vue"];
const INDEX_FILES = [
  "index.ts",
  "index.tsx",
  "index.mts",
  "index.cts",
  "index.js",
  "index.jsx",
  "index.mjs",
  "index.cjs",
  "index.vue",
];

export type ResolveOptions = {
  rootDir: string;
  aliasPrefix: string;
  aliasRoot: string;
  srcRoot: string;
  layerAliases?: LayerAliases;
  /** When false, cross-root targets are treated as unresolved for nesting rules. */
  crossRoot?: boolean;
};

export type ResolveResult =
  | {
      status: "resolved";
      path: string;
      canonical: string;
      exists: boolean;
      via: "eslint" | "alias" | "relative" | "prefix";
      query?: string;
      hash?: string;
    }
  | {
      status: "external";
      via: "builtin" | "package" | "node_modules";
      path?: string;
      query?: string;
      hash?: string;
    }
  | {
      status: "unresolved";
      specifier: string;
      candidate?: string;
      query?: string;
      hash?: string;
    }
  | {
      status: "unsupported";
      reason: "non-string" | "virtual" | "remote" | "data";
      specifier?: string;
    };

type SpecifierParts = {
  bare: string;
  query?: string;
  hash?: string;
};

function toPosix(value: string) {
  return value.replace(/\\/g, "/");
}

function splitSpecifier(specifier: string): SpecifierParts {
  // Aliases may start with '#'; only treat '#' as a fragment after a non-empty path.
  let bare = specifier;
  let hash: string | undefined;
  if (!specifier.startsWith("#")) {
    const hashIndex = specifier.indexOf("#");
    if (hashIndex >= 0) {
      bare = specifier.slice(0, hashIndex);
      hash = specifier.slice(hashIndex);
    }
  }
  const queryIndex = bare.indexOf("?");
  if (queryIndex < 0) return { bare, hash };
  return {
    bare: bare.slice(0, queryIndex),
    query: bare.slice(queryIndex),
    hash,
  };
}

function looksLikeNodeModules(absolute: string) {
  return toPosix(absolute).split("/").includes("node_modules");
}

function canonicalPath(absolute: string) {
  try {
    return fs.realpathSync(absolute);
  } catch {
    return absolute;
  }
}

function existingPath(candidate: string): string | null {
  try {
    const stats = fs.statSync(candidate);
    if (stats.isFile() || stats.isDirectory()) return candidate;
  } catch {
    // continue
  }
  return null;
}

function isFile(candidate: string) {
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

/** Resolve a filesystem candidate with common extensions and index files. */
export function resolveExistingPath(candidate: string): string | null {
  const direct = existingPath(candidate);
  if (direct) {
    if (isFile(direct)) return direct;
    for (const index of INDEX_FILES) {
      const indexed = existingPath(path.join(direct, index));
      if (indexed) return indexed;
    }
    return direct;
  }
  // ESM TypeScript sources spell runtime extensions in their imports.
  const sourceExtensions: Record<string, string[]> = {
    ".js": [".ts", ".tsx"],
    ".jsx": [".tsx"],
    ".mjs": [".mts"],
    ".cjs": [".cts"],
  };
  const runtimeExtension = path.extname(candidate);
  for (const extension of sourceExtensions[runtimeExtension] ?? []) {
    const source = existingPath(candidate.slice(0, -runtimeExtension.length) + extension);
    if (source && isFile(source)) return source;
  }
  for (const extension of FILE_EXTENSIONS) {
    const withExt = existingPath(candidate + extension);
    if (withExt) return withExt;
  }
  for (const index of INDEX_FILES) {
    const indexed = existingPath(path.join(candidate, index));
    if (indexed) return indexed;
  }
  return null;
}

function resolveLayerAlias(sourceValue: string, layerAliases?: LayerAliases) {
  if (!layerAliases) return null;
  const aliases = Object.keys(layerAliases).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    if (sourceValue === alias) return layerAliases[alias];
    if (sourceValue.startsWith(`${alias}/`)) {
      return path.join(layerAliases[alias], sourceValue.slice(alias.length + 1));
    }
  }
  return null;
}

function classifyUnsupported(specifier: string): ResolveResult | null {
  if (specifier.startsWith("\0") || specifier.startsWith("virtual:")) {
    return { status: "unsupported", reason: "virtual", specifier };
  }
  if (/^https?:\/\//i.test(specifier)) {
    return { status: "unsupported", reason: "remote", specifier };
  }
  if (specifier.startsWith("data:")) {
    return { status: "unsupported", reason: "data", specifier };
  }
  return null;
}

function asResolved(
  absolute: string,
  via: "eslint" | "alias" | "relative" | "prefix",
  parts: SpecifierParts,
  exists: boolean,
): ResolveResult {
  const normalized = path.normalize(absolute);
  const canonical = exists ? canonicalPath(normalized) : normalized;
  return {
    status: "resolved",
    path: normalized,
    canonical,
    exists,
    via,
    query: parts.query,
    hash: parts.hash,
  };
}

function asUnresolved(parts: SpecifierParts, candidate?: string): ResolveResult {
  return {
    status: "unresolved",
    specifier: parts.bare,
    candidate: candidate ? path.normalize(candidate) : undefined,
    query: parts.query,
    hash: parts.hash,
  };
}

function finishTarget(
  absolute: string,
  via: "eslint" | "alias" | "relative" | "prefix",
  parts: SpecifierParts,
  options: ResolveOptions,
  filename: string,
  context: Rule.RuleContext | null,
): ResolveResult {
  if (looksLikeNodeModules(absolute)) {
    return { status: "external", via: "node_modules", path: absolute, query: parts.query, hash: parts.hash };
  }
  const roots = context ? (context.options[0] as { roots?: RuleRoots } | undefined)?.roots : undefined;
  if (roots && !options.crossRoot) {
    const from = rootForPath(filename, options.rootDir, roots);
    const to = rootForPath(absolute, options.rootDir, roots);
    // Suppress nesting/visibility checks inside another FEOD root.
    if (from && to && from !== to) return asUnresolved(parts);
  }

  const existing = resolveExistingPath(absolute);
  if (existing) return asResolved(existing, via, parts, true);
  // Trust the configured ESLint resolver even when our existence probe cannot see the file
  // (virtual/generated targets). Alias/relative fallbacks without a file stay unresolved.
  if (via === "eslint") return asResolved(absolute, via, parts, true);
  return asUnresolved(parts, absolute);
}

function resolveWithFallbacks(
  parts: { bare: string; query?: string; hash?: string },
  filename: string,
  options: ResolveOptions,
  context: Rule.RuleContext | null,
): ResolveResult {
  const aliasResolved = resolveLayerAlias(parts.bare, options.layerAliases);
  if (aliasResolved) {
    const absolute = path.isAbsolute(aliasResolved) ? aliasResolved : path.join(options.rootDir, aliasResolved);
    return finishTarget(absolute, "alias", parts, options, filename, context);
  }

  if (parts.bare.startsWith(".")) {
    return finishTarget(
      path.resolve(path.dirname(filename), parts.bare),
      "relative",
      parts,
      options,
      filename,
      context,
    );
  }

  if (parts.bare.startsWith(`${options.aliasPrefix}/`)) {
    return finishTarget(
      path.join(options.rootDir, options.aliasRoot, parts.bare.slice(options.aliasPrefix.length + 1)),
      "prefix",
      parts,
      options,
      filename,
      context,
    );
  }

  if (parts.bare.startsWith(`${options.srcRoot}/`)) {
    return finishTarget(path.join(options.rootDir, parts.bare), "prefix", parts, options, filename, context);
  }

  if (!parts.bare.startsWith("/") && !path.win32.isAbsolute(parts.bare)) {
    return { status: "external", via: "package", query: parts.query, hash: parts.hash };
  }

  return asUnresolved(parts);
}

/**
 * Classify an import specifier into resolved / external / unresolved / unsupported.
 * Preserves user ESLint import resolvers; falls back to aliases and path candidates.
 */
export function resolveImport(
  sourceValue: unknown,
  context: Rule.RuleContext,
  filename: string,
  options: ResolveOptions,
): ResolveResult {
  if (!sourceValue || typeof sourceValue !== "string") {
    return { status: "unsupported", reason: "non-string" };
  }

  const unsupported = classifyUnsupported(sourceValue);
  if (unsupported) return unsupported;

  const parts = splitSpecifier(sourceValue);
  if (!parts.bare) return asUnresolved(parts);

  if (builtins.has(parts.bare)) {
    return { status: "external", via: "builtin", query: parts.query, hash: parts.hash };
  }

  try {
    const resolved = eslintResolve(parts.bare, context);
    if (resolved) return finishTarget(resolved, "eslint", parts, options, filename, context);
  } catch {
    // fall through to FEOD fallbacks
  }

  return resolveWithFallbacks(parts, filename, options, context);
}

/** Path resolution for project scans without an ESLint rule context (graph / CLI). */
export function resolveImportOffline(sourceValue: unknown, filename: string, options: ResolveOptions): ResolveResult {
  if (!sourceValue || typeof sourceValue !== "string") {
    return { status: "unsupported", reason: "non-string" };
  }
  const unsupported = classifyUnsupported(sourceValue);
  if (unsupported) return unsupported;
  const parts = splitSpecifier(sourceValue);
  if (!parts.bare) return asUnresolved(parts);
  if (builtins.has(parts.bare)) {
    return { status: "external", via: "builtin", query: parts.query, hash: parts.hash };
  }
  return resolveWithFallbacks(parts, filename, options, null);
}

/**
 * Legacy path helper for structure rules: returns a local absolute path when
 * architecture checks should run. Missing local files still yield structural candidates.
 * External / unsupported / bare packages return null.
 */
export function resolveImportPath(
  sourceValue: unknown,
  context: Rule.RuleContext,
  filename: string,
  options: ResolveOptions,
) {
  const result = resolveImport(sourceValue, context, filename, options);
  if (result.status === "resolved") return result.canonical;
  if (result.status === "unresolved" && result.candidate) return result.candidate;
  return null;
}

/** Local-looking specifier that did not resolve to an existing file. */
export function isMissingLocalImport(result: ResolveResult) {
  return result.status === "unresolved" && Boolean(result.candidate);
}
