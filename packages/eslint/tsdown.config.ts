import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/app/index.ts", presets: "src/app/presets.ts" },
  format: ["esm"],
  dts: false,
});
