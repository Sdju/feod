import path from "node:path";
import type { Rule } from "eslint";
import { getFilename } from "./context.js";

export type RootRuleOptions = { srcRoot?: string; rootDir?: string; [key: string]: unknown };
export type RuleRoots = Record<string, RootRuleOptions>;

/** The nearest configured root owns a file, including nested workspace roots. */
export function rootForPath(filename: string, rootDir: string, roots: RuleRoots): string | undefined {
  const absolute = path.resolve(rootDir, filename);
  return Object.keys(roots)
    .sort((a, b) => b.split(/[\\/]/).length - a.split(/[\\/]/).length || b.length - a.length)
    .find(root => {
      const relative = path.relative(path.resolve(rootDir, root), absolute);
      return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
    });
}

/** Dispatch existing file rules without changing their single-root policy. */
export function withRoots(rule: Rule.RuleModule): Rule.RuleModule {
  const schema = Array.isArray(rule.meta?.schema) ? rule.meta.schema[0] : undefined;
  const rootSchema = schema && {
    ...schema,
    properties: { ...schema.properties, enabled: { type: "boolean" } },
  };
  return {
    ...rule,
    meta: {
      ...rule.meta,
      schema: rootSchema
        ? [
            {
              ...rootSchema,
              properties: {
                ...rootSchema.properties,
                roots: {
                  type: "object",
                  minProperties: 1,
                  additionalProperties: rootSchema,
                },
              },
            },
          ]
        : rule.meta?.schema,
    },
    create(context) {
      const options = (context.options[0] ?? {}) as RootRuleOptions & { roots?: RuleRoots };
      if (!options.roots) return options.enabled === false ? {} : rule.create(context);
      const filename = getFilename(context);
      const root = rootForPath(filename, (options.rootDir as string) ?? process.cwd(), options.roots);
      // Only explicit roots are architecture; a file outside every root is not checked.
      if (!root) return {};
      const selected = options.roots[root];
      if (selected.enabled === false) return {};
      const scoped = Object.create(context, {
        options: { value: [{ ...selected, roots: options.roots }], enumerable: true },
      }) as Rule.RuleContext;
      return rule.create(scoped);
    },
  };
}
