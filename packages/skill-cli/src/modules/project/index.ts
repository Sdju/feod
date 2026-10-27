import { relative } from "node:path";

import { FeodConfigError, loadFeodConfig } from "@o-feod/config";

import { collectFindings } from "./findings.js";
import { readProfile } from "./profile.js";
import { scanRoot } from "./scan.js";
import type { ProjectInfo } from "./types.js";

export { renderText } from "./render.js";
export type * from "./types.js";
export { FeodConfigError };

/** Everything FEOD knows about a project: config, profile, disk layout and the drift between them. */
export function collectProjectInfo(rootDir: string): ProjectInfo {
  const loaded = loadFeodConfig({ rootDir });
  const configSource = loaded.filepath ? relative(loaded.rootDir, loaded.filepath).replace(/\\/g, "/") : null;
  const configLabel = configSource === "package.json" ? "package.json#feod" : configSource;
  const profile = readProfile(loaded.rootDir);
  const roots = Object.entries(loaded.config.roots).map(([root, config]) => scanRoot(loaded.rootDir, root, config));
  return {
    rootDir: loaded.rootDir,
    configSource: configLabel,
    profile,
    roots,
    findings: collectFindings(loaded.rootDir, roots, profile, configLabel),
  };
}
