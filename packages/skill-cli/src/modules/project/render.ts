import type { ProjectInfo } from "./types.js";

const MARK = { error: "x", warn: "!", info: "-" } as const;

/** Compact human-readable report in FEOD terms: roots, layers, modules, drift. */
export function renderText(info: ProjectInfo): string {
  const out: string[] = [];
  out.push(`FEOD project: ${info.rootDir}`);
  out.push(`config:  ${info.configSource ?? "defaults (no feod config)"}`);
  if (info.profile) {
    const values = Object.entries(info.profile.values)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");
    out.push(`profile: ${info.profile.path}${values ? ` (${values})` : ""}`);
  } else {
    out.push("profile: none");
  }
  for (const root of info.roots) {
    out.push(
      "",
      `root ${root.root}  (alias ${root.aliasPrefix} -> ${root.aliasRoot})${root.exists ? "" : "  MISSING"}`,
    );
    for (const layer of root.layers) {
      const role = layer.role && layer.role !== layer.name ? ` [${layer.role}]` : "";
      const imports = layer.imports.length ? `  imports: ${layer.imports.join(", ")}` : "  imports: none";
      out.push(`  ${layer.exists ? "+" : " "} ${layer.name}${role}  ${layer.dir}/${imports}`);
    }
    if (root.modules.length) {
      out.push(`  modules (${root.modules.length}):`);
      for (const module of root.modules) {
        const notes = [
          module.kind === "file" ? "single-file" : module.entry ? module.entry : "NO ENTRY",
          module.transit ? "transit" : "",
          module.submodules.length ? `submodules: ${module.submodules.join(", ")}` : "",
          module.hasPages ? "pages" : "",
        ].filter(Boolean);
        out.push(`    ${module.name}  ${notes.join("  ")}`);
      }
    }
  }
  const shown = info.findings;
  if (shown.length) {
    out.push("", "findings:");
    for (const finding of shown) out.push(`  ${MARK[finding.severity]} ${finding.code}: ${finding.message}`);
  } else {
    out.push("", "findings: none");
  }
  return `${out.join("\n")}\n`;
}
