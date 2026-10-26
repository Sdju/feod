import { defineConfig } from "oxlint";
import { fileURLToPath } from "node:url";
import { createConfig } from "./dist/configs.mjs";
import feod from "./feod.config.js";

export default defineConfig({
  ...createConfig(feod, { rootDir: fileURLToPath(new URL(".", import.meta.url)), preset: "strict" }),
  jsPlugins: [{ name: "feod-structure", specifier: "./dist/index.mjs" }],
  plugins: [],
  categories: { correctness: "off" },
});
