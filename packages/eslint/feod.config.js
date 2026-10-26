import { libraryLayers } from "./dist/presets.mjs";

// Rules have exactly the isolation and private-module semantics of pages.
export default {
  layers: {
    ...libraryLayers,
    app: { ...libraryLayers.app, imports: [...libraryLayers.app.imports, "rules"] },
    rules: { imports: ["modules", "common"], role: "pages" },
    global: { ...libraryLayers.global, imports: [...libraryLayers.global.imports, "rules"] },
  },
  modules: { requirePublicEntry: true },
  inventory: { uncovered: true },
  cycles: { modules: true, files: true, types: "include" },
  imports: { unresolved: "forbid", computed: "forbid" },
};
