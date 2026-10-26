import { createIgnoreMatcher } from "../common/ignore.js";
import path from "node:path";
import picomatch from "picomatch";
import type { Rule } from "eslint";
import {
  getFilename,
  importListeners,
  resolveImportOffline,
} from "../modules/Architecture/index.js";

import { confineSchema, type ConfinePolicy } from "../modules/Confine/index.js";

type Options = {
  confine?: ConfinePolicy; rootDir?: string; srcRoot?: string; ignore?: string | string[];
  aliasPrefix?: string; aliasRoot?: string; layerAliases?: Record<string, string>;
};

type Node = { type: string; value?: unknown; parent?: Node; source?: Node; quasis?: { value: { cooked: string | null } }[] };

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Confine configured imports, resolved targets and string literals to allowed files" },
    schema: [{ type: "object", additionalProperties: false, properties: {
      confine: confineSchema, rootDir: { type: "string" }, srcRoot: { type: "string" },
      aliasPrefix: { type: "string" }, aliasRoot: { type: "string" },
      layerAliases: { type: "object", additionalProperties: { type: "string" } },
      ignore: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
    } }],
    messages: {
      confinedImport: "FEOD: import '{{value}}' is confined by '{{name}}' to {{allowed}}.",
      confinedLiteral: "FEOD: literal '{{value}}' is confined by '{{name}}' to {{allowed}}.",
      custom: "FEOD: {{message}}",
    },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as Options;
    if (!options.confine?.length) return {};
    const filename = getFilename(context);
    if (!filename || filename.startsWith("<")) return {};
    const rootDir = path.resolve(options.rootDir ?? process.cwd());
    const absolute = path.resolve(rootDir, filename);
    if (createIgnoreMatcher(options.ignore, rootDir)(absolute)) return {};
    const relative = path.relative(rootDir, absolute).replace(/\\/g, "/");

    // Only entries that apply to this file are compiled and consulted.
    const entries = options.confine.filter(entry => !picomatch(entry.allowedIn ?? [], { dot: true })(relative))
      .map(entry => ({
        entry,
        imports: entry.imports?.length ? picomatch(entry.imports, { dot: true, bash: true }) : undefined,
        targets: entry.targets?.length ? picomatch(entry.targets, { dot: true }) : undefined,
        literals: entry.literals?.map(source => new RegExp(source)) ?? [],
        allowed: entry.allowedIn?.length ? entry.allowedIn.map(glob => `'${glob}'`).join(", ") : "no files",
      }));
    if (!entries.length) return {};

    const srcRoot = (options.srcRoot ?? "src").replace(/\\/g, "/");
    function resolveTarget(specifier: string) {
      const result = resolveImportOffline(specifier, absolute, {
        rootDir, srcRoot, aliasPrefix: options.aliasPrefix ?? "@", aliasRoot: options.aliasRoot ?? srcRoot,
        layerAliases: options.layerAliases, crossRoot: true,
      });
      if (result.status !== "resolved") return "";
      return path.relative(rootDir, result.canonical).replace(/\\/g, "/");
    }

    function report(node: unknown, kind: "confinedImport" | "confinedLiteral", value: string, item: (typeof entries)[number]) {
      const data = { value, name: item.entry.name, allowed: item.allowed, message: item.entry.message ?? "" };
      context.report({ node: node as Rule.Node, messageId: item.entry.message ? "custom" : kind, data });
    }
    function literal(node: Node, value: string) {
      // Import sources belong to `imports`; matching them as text would double-report.
      const parent = node.parent;
      if (parent?.source === node && /^(?:Import|Export\w*)Declaration$/.test(parent.type)) return;
      for (const item of entries) {
        if (item.literals.some(pattern => pattern.test(value))) report(node, "confinedLiteral", value, item);
      }
    }

    return {
      ...importListeners(context, (node, specifier, typeOnly) => {
        let target: string | undefined;
        for (const item of entries) {
          if (typeOnly && item.entry.allowTypeImports) continue;
          if (item.imports?.(specifier)) { report(node, "confinedImport", specifier, item); continue; }
          if (!item.targets) continue;
          // Resolve lazily and once: relative and alias imports are judged by where they land.
          target ??= resolveTarget(specifier);
          if (target && item.targets(target)) report(node, "confinedImport", specifier, item);
        }
      }),
      Literal(node) {
        const value = (node as Node).value;
        if (typeof value === "string") literal(node as Node, value);
      },
      TemplateLiteral(node) {
        for (const quasi of (node as Node).quasis ?? []) if (quasi.value.cooked) literal(node as Node, quasi.value.cooked);
      },
    };
  },
};
export default rule;
