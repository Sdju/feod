export type DependencyKind =
  | "import"
  | "export"
  | "dynamic"
  | "require"
  | "import-equals"
  | "ts-import-type";

export type ExtractedDependency = {
  specifier: string;
  typeOnly: boolean;
  kind: DependencyKind;
};

function stripComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function extractVueScripts(source: string) {
  const blocks: string[] = [];
  const pattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) blocks.push(match[1] ?? "");
  return blocks.length ? blocks.join("\n") : source;
}

function push(
  out: ExtractedDependency[],
  specifier: string | undefined,
  typeOnly: boolean,
  kind: DependencyKind,
) {
  if (!specifier) return;
  out.push({ specifier, typeOnly, kind });
}

/**
 * Lightweight static dependency extractor for project graph scans.
 * Covers the common forms of importListeners; not a full TS/Vue parser.
 */
export function extractStaticDependencies(source: string, filename = ""): ExtractedDependency[] {
  const code = stripComments(filename.endsWith(".vue") ? extractVueScripts(source) : source);
  const out: ExtractedDependency[] = [];
  let match: RegExpExecArray | null;

  const fromClause = /\b(import|export)\s+(type\s+)?(?:[\s\S]*?\s+from\s+)["']([^"']+)["']/g;
  while ((match = fromClause.exec(code))) {
    push(out, match[3], Boolean(match[2]), match[1] === "export" ? "export" : "import");
  }

  const sideEffect = /\bimport\s*["']([^"']+)["']/g;
  while ((match = sideEffect.exec(code))) push(out, match[1], false, "import");

  const exportStar = /\bexport\s+(type\s+)?\*\s+(?:as\s+\w+\s+)?from\s*["']([^"']+)["']/g;
  while ((match = exportStar.exec(code))) push(out, match[2], Boolean(match[1]), "export");

  const importEquals = /\bimport\s+(type\s+)?\w+\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = importEquals.exec(code))) push(out, match[2], Boolean(match[1]), "import-equals");

  const requireCall = /(?<![.\w])require\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = requireCall.exec(code))) push(out, match[1], false, "require");

  const dynamicOrType = /\b(?:(typeof)\s+)?import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = dynamicOrType.exec(code))) {
    const typeOnly = Boolean(match[1]);
    push(out, match[2], typeOnly, typeOnly ? "ts-import-type" : "dynamic");
  }

  const seen = new Set<string>();
  return out.filter(item => {
    const key = `${item.kind}\0${item.typeOnly}\0${item.specifier}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
