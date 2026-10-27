import { defineConfig } from "vite-plus";

export default defineConfig({
  cacheDir: ".vitest-cache",
  pack: {
    entry: { index: "src/app/index.ts", presets: "src/app/presets.ts" },
    format: ["esm"],
    dts: false,
  },
});
