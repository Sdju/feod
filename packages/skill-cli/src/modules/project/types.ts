export type Severity = "error" | "warn" | "info";

export type Finding = { severity: Severity; code: string; message: string };

export type ModuleInfo = {
  name: string;
  /** Path relative to the project root. */
  path: string;
  kind: "directory" | "file";
  /** Public entry file name; null when a directory module has none. */
  entry: string | null;
  transit: boolean;
  submodules: string[];
  hasPages: boolean;
};

export type LayerInfo = {
  name: string;
  role: string | null;
  dir: string;
  exists: boolean;
  imports: string[];
};

export type RootInfo = {
  root: string;
  exists: boolean;
  aliasPrefix: string;
  aliasRoot: string;
  layers: LayerInfo[];
  modules: ModuleInfo[];
  /** Entries of the root that belong to no layer. */
  uncovered: string[];
  flags: { modulePages: boolean; singleFileModules: boolean; transitModules: string[] };
};

export type ProfileInfo = { path: string; values: Record<string, string> };

export type ProjectInfo = {
  rootDir: string;
  /** Config file (or package.json) the settings come from; null means built-in defaults. */
  configSource: string | null;
  profile: ProfileInfo | null;
  roots: RootInfo[];
  findings: Finding[];
};
