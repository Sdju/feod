import { createPathMemoizer } from "../common/cache.js";
import { createIgnoreMatcher } from "../common/ignore.js";
import path from "node:path";
import type { Rule } from "eslint";

import {
  getFilename,
  importListeners,
  type LayerAliases,
  type LayerDirs,
  getLayerAliases,
  getLayerDirs,
  resolveImportPath,
} from "../modules/Architecture/index.js";

type Options = {
  rootDir?: string;
  aliasPrefix?: string;
  aliasRoot?: string;
  ignore?: string | string[];
  srcRoot?: string;
  layerDirs?: LayerDirs;
  layerAliases?: LayerAliases;
};

type PrivateModuleInfo = {
  privateRoot: string;
  scopeRoot: string;
  privateName: string;
  isRootLevel: boolean;
};

function toPosix(value: string) {
  return value.replace(/\\/g, "/");
}

function normalizeFilename(filename: string, rootDir: string) {
  if (!filename || filename.startsWith("<")) return null;
  if (path.isAbsolute(filename)) return filename;
  return path.resolve(rootDir, filename);
}

function getPrivateModuleInfo(relativePath: string, pagesDir: string): PrivateModuleInfo | null {
  if (!relativePath.startsWith(`${pagesDir}/`)) return null;
  const rest = relativePath.slice(pagesDir.length + 1);
  if (!rest) return null;
  const parts = rest.split("/");
  const privateIndex = parts.findIndex(part => part.startsWith("_") && part.length > 1);
  if (privateIndex === -1) return null;
  const privateName = parts[privateIndex].slice(1);
  if (!privateName) return null;
  const privateRoot = `${pagesDir}/${parts.slice(0, privateIndex + 1).join("/")}`;
  const scopeRoot = privateIndex === 0 ? pagesDir : `${pagesDir}/${parts.slice(0, privateIndex).join("/")}`;
  return {
    privateRoot,
    scopeRoot,
    privateName,
    isRootLevel: privateIndex === 0,
  };
}

function isAllowedPrivateImport(importerRelative: string, pagesDir: string, info: PrivateModuleInfo) {
  if (!importerRelative.startsWith(`${pagesDir}/`)) return false;
  if (importerRelative === info.privateRoot || importerRelative.startsWith(`${info.privateRoot}/`)) {
    return true;
  }

  if (info.isRootLevel) {
    const rest = importerRelative.slice(pagesDir.length + 1);
    if (!rest || rest.includes("/")) return false;
    const parsed = path.posix.parse(rest);
    return parsed.name === info.privateName || parsed.name.startsWith(`${info.privateName}.`);
  }

  const scopePrefix = `${info.scopeRoot}/`;
  return importerRelative.startsWith(scopePrefix);
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Limit access to private page modules in FEOD pages",
    },
    schema: [
      {
        type: "object",
        properties: {
          rootDir: { type: "string" },
          aliasPrefix: { type: "string" },
          aliasRoot: { type: "string" },
          ignore: {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
          },
          srcRoot: { type: "string" },
          layerDirs: {
            type: "object",
            properties: {
              pages: { type: "string" },
            },
            additionalProperties: false,
          },
          layerAliases: {
            type: "object",
            additionalProperties: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      privateModuleOutOfScope: "FEOD: private page module can only be imported by its page scope.",
    },
  },
  create(context) {
    const options = (context.options[0] || {}) as Options;
    const rootDir = path.resolve(options.rootDir || process.cwd());
    const srcRoot = options.srcRoot || "src";
    const layerDirs = getLayerDirs(srcRoot, options.layerDirs);
    const layerAliases = getLayerAliases(layerDirs, options.layerAliases);
    const aliasPrefix = options.aliasPrefix || "@";
    const aliasRoot = options.aliasRoot || srcRoot;
    const filename = normalizeFilename(getFilename(context), rootDir);
    const isIgnored = createIgnoreMatcher(options.ignore, rootDir);

    if (!filename || isIgnored(filename)) {
      return {};
    }

    const privateCache = createPathMemoizer(relativePath => getPrivateModuleInfo(relativePath, layerDirs.pages));

    function validateImport(node: unknown, sourceValue: unknown) {
      if (!filename) return;
      const resolved = resolveImportPath(sourceValue, context, filename, {
        rootDir,
        aliasPrefix,
        aliasRoot,
        srcRoot,
        layerAliases,
      });
      if (!resolved) return;
      if (isIgnored(resolved)) return;
      const relative = toPosix(path.relative(rootDir, resolved));
      if (!relative || relative.startsWith("..")) return;
      const info = privateCache.get(relative);
      if (!info) return;

      const importerRelative = toPosix(path.relative(rootDir, filename));
      if (!isAllowedPrivateImport(importerRelative, layerDirs.pages, info)) {
        context.report({
          node: node as Rule.Node,
          messageId: "privateModuleOutOfScope",
        });
      }
    }

    return importListeners(context, validateImport);
  },
};

export default rule;
