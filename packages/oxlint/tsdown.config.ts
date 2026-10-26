import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/app/index.ts", presets: "src/app/presets.ts", configs: "src/app/configs.ts" },
  format: ["esm"],
  dts: false,
  deps: { neverBundle: ["@o-feod/eslint-structure-plugin"] },
});
