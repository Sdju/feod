import { defineConfig } from "vite-plus";

export default defineConfig({
  cacheDir: ".vitest-cache",
  test: {
    setupFiles: ["./test/setup.ts"],
  },
  pack: {
    entry: { index: "src/app/index.ts", presets: "src/app/presets.ts", configs: "src/app/configs.ts" },
    format: ["esm"],
    dts: false,
    deps: { neverBundle: ["@o-feod/eslint-structure-plugin"] },
  },
});
