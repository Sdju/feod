import { join } from "node:path";

import { findEntry } from "./scan.js";
import { profileLayers } from "./profile.js";
import type { Finding, ProfileInfo, RootInfo } from "./types.js";

const REQUIRED_ROLES = new Set(["modules"]);

/** Drift between config, disk and profile. Never lints imports: that is the plugins' job. */
export function collectFindings(
  rootDir: string,
  roots: RootInfo[],
  profile: ProfileInfo | null,
  configSource: string | null,
): Finding[] {
  const findings: Finding[] = [];
  const add = (severity: Finding["severity"], code: string, message: string) =>
    findings.push({ severity, code, message });

  if (!profile)
    add(
      "info",
      "profile-missing",
      "no feod.profile.md: skill defaults apply (base modification); run the skill's init flow to lock a profile",
    );
  if (!configSource)
    add(
      "info",
      "config-defaults",
      "no feod config: built-in defaults are used (srcRoot 'src', layers app/pages/modules/common/global)",
    );

  for (const root of roots) {
    if (!root.exists) {
      add("error", "root-missing", `root '${root.root}' does not exist`);
      continue;
    }
    for (const layer of root.layers) {
      if (layer.exists) continue;
      const severity = layer.role && REQUIRED_ROLES.has(layer.role) ? "warn" : "info";
      add(severity, "layer-missing", `${root.root}: layer '${layer.name}' has no directory '${layer.dir}'`);
    }
    for (const module of root.modules) {
      if (module.kind === "directory" && !module.entry && !module.transit) {
        add("warn", "module-no-entry", `${module.path}: no public entry (index file)`);
      }
      if (module.kind === "file" && !root.flags.singleFileModules) {
        add("warn", "single-file-module", `${module.path}: single-file module but singleFileModules is off`);
      }
    }
    for (const entry of root.uncovered) {
      add("warn", "uncovered", `${root.root}/${entry}: belongs to no layer`);
    }
    const common = root.layers.find(layer => layer.role === "common");
    if (common?.exists && findEntry(join(rootDir, root.root, common.dir), [])) {
      const allowed = profile?.values["common.allowIndex"] === "true";
      if (!allowed)
        add(
          "warn",
          "common-index",
          `${root.root}/${common.dir}: index file in common (profile allowIndex is not true)`,
        );
    }
  }

  const listed = profileLayers(profile);
  if (listed && roots[0]) {
    const actual = roots[0].layers.map(layer => layer.dir.split("/").pop()!);
    const missing = listed.filter(name => !actual.includes(name));
    const extra = actual.filter(name => !listed.includes(name));
    if (missing.length || extra.length) {
      add(
        "warn",
        "profile-layers",
        `profile layers differ from config: ${[
          missing.length ? `not in config: ${missing.join(", ")}` : "",
          extra.length ? `not in profile: ${extra.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("; ")}`,
      );
    }
  }
  return findings;
}
