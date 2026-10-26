export type LayerRole = "app" | "pages" | "modules" | "common" | "global";
export type LayerDefinition = {
  dir?: string;
  imports: readonly string[];
  /** Opt into the existing FEOD structural rules for this layer. */
  role?: LayerRole;
};
export type LayerSet = Readonly<Record<string, LayerDefinition>>;

export const frontendLayers: LayerSet = {
  app: { imports: ["app", "pages", "modules", "common"], role: "app" },
  pages: { imports: ["modules", "common"], role: "pages" },
  modules: { imports: ["modules", "common"], role: "modules" },
  common: { imports: ["common"], role: "common" },
  global: { imports: ["app", "pages", "modules", "common", "global"], role: "global" },
};

export const backendLayers: LayerSet = {
  app: { imports: ["app", "routes", "middlewares", "modules", "common"], role: "app" },
  routes: { imports: ["modules", "common"] },
  middlewares: { imports: ["modules", "common"] },
  modules: { imports: ["modules", "common"], role: "modules" },
  common: { imports: ["common"], role: "common" },
  global: { imports: ["app", "routes", "middlewares", "modules", "common", "global"], role: "global" },
};

export const libraryLayers: LayerSet = {
  app: { imports: ["app", "modules", "common"], role: "app" },
  modules: { imports: ["modules", "common"], role: "modules" },
  common: { imports: ["common"], role: "common" },
  global: { imports: ["app", "modules", "common", "global"], role: "global" },
};

export const cliLayers: LayerSet = {
  app: { imports: ["app", "commands", "modules", "common"], role: "app" },
  commands: { imports: ["modules", "common"], role: "pages" },
  modules: { imports: ["modules", "common"], role: "modules" },
  common: { imports: ["common"], role: "common" },
  global: { imports: ["app", "commands", "modules", "common", "global"], role: "global" },
};
