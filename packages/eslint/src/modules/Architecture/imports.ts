import type { Rule } from "eslint";

import type { ImportPolicy } from "@o-feod/config";
export type { ImportPolicy };
export const importPolicySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    computed: { enum: ["ignore", "forbid"], default: "ignore" },
    unresolved: { enum: ["ignore", "forbid"], default: "ignore" },
  },
};

// Structural subset shared by ESTree, typescript-eslint and Oxlint ASTs.
type ImportNode = {
  type: string;
  value?: unknown;
  name?: string;
  source?: ImportNode;
  argument?: ImportNode;
  literal?: ImportNode;
  expression?: ImportNode;
  callee?: ImportNode;
  object?: ImportNode;
  property?: ImportNode;
  meta?: ImportNode;
  computed?: boolean;
  importKind?: string;
  exportKind?: string;
  parent?: ImportNode;
  specifiers?: ImportNode[];
  arguments?: ImportNode[];
  expressions?: ImportNode[];
  quasis?: { value: { cooked: string | null } }[];
};

function staticString(node: ImportNode | undefined): string | undefined {
  if (node?.type === "Literal" && typeof node.value === "string") return node.value;
  if (node?.type === "TemplateLiteral" && node.expressions?.length === 0) {
    return node.quasis?.[0]?.value.cooked ?? undefined;
  }
  return undefined;
}

function member(node: ImportNode | undefined, property: string) {
  return node?.type === "MemberExpression" && !node.computed && node.property?.name === property;
}

/** Visit statically known dependency specifiers; boundary policy stays in rules. */
export function importListeners(
  context: Rule.RuleContext,
  validate: (node: unknown, specifier: string, typeOnly: boolean) => void,
  computed?: (node: unknown, loader: "import" | "require") => void,
): Rule.RuleListener {
  function unshadowed(node: ImportNode, name: string) {
    let scope = context.sourceCode.getScope(node as unknown as Rule.Node);
    while (scope) {
      const variable = scope.set.get(name);
      if (variable) return variable.defs.length === 0;
      if (!scope.upper) break;
      scope = scope.upper;
    }
    return true;
  }

  function visit(source: ImportNode | undefined, typeOnly = false) {
    const value = staticString(source);
    if (value !== undefined) validate(source, value, typeOnly);
  }

  function dynamicSource(source: ImportNode) {
    if (member(source, "href")) {
      const url = source.object;
      const args = url?.arguments;
      const base = args?.[1];
      if (
        url?.type === "NewExpression" &&
        url.callee?.type === "Identifier" &&
        url.callee.name === "URL" &&
        unshadowed(url, "URL") &&
        args?.length === 2 &&
        member(base, "url") &&
        base?.object?.type === "MetaProperty" &&
        base.object.meta?.name === "import" &&
        base.object.property?.name === "meta"
      ) {
        const value = staticString(args[0]);
        if (value?.startsWith("./") || value?.startsWith("../")) return args[0];
      }
    }
    return source;
  }

  function dynamic(node: ImportNode, source: ImportNode | undefined, loader: "import" | "require") {
    if (staticString(source) !== undefined) visit(source);
    else computed?.(source ?? node, loader);
  }

  const declaration = (node: unknown) => {
    const declaration = node as ImportNode;
    const kind = declaration.type === "ImportDeclaration" ? "importKind" : "exportKind";
    const typeOnly =
      declaration[kind] === "type" ||
      Boolean(declaration.specifiers?.length && declaration.specifiers.every(specifier => specifier[kind] === "type"));
    visit(declaration.source, typeOnly);
  };
  return {
    ImportDeclaration: declaration,
    ExportNamedDeclaration: declaration,
    ExportAllDeclaration: declaration,
    ImportExpression(node) {
      const expression = node as unknown as ImportNode;
      dynamic(expression, expression.source && dynamicSource(expression.source), "import");
    },
    CallExpression(node) {
      const call = node as unknown as ImportNode;
      if (call.callee?.type === "Identifier" && call.callee.name === "require" && unshadowed(call, "require"))
        dynamic(call, call.arguments?.[0], "require");
    },
    TSImportType(node: unknown) {
      const type = node as ImportNode;
      // Newer parsers use source; older ones wrap argument in TSLiteralType.
      const source = type.source ?? type.argument;
      visit(source?.type === "TSLiteralType" ? source.literal : source, true);
    },
    TSExternalModuleReference(node: unknown) {
      const reference = node as ImportNode;
      visit(reference.expression, reference.parent?.importKind === "type");
    },
  };
}
