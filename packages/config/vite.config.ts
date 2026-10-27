import { defineConfig } from "vite-plus";

export default defineConfig({
  cacheDir: ".vitest-cache",
  pack: {
    entry: { index: "src/app/index.ts" },
    format: ["esm"],
    dts: false,
  },
});
