import { defineConfig } from "vite-plus";

/**
 * One self-contained, readable script for the delivered skill (`pnpm run skill:pack` copies `dist/`
 * to `skills/feod/scripts/`). The config core and its dependencies are bundled: the skill is run with
 * a bare `node`, without installing anything.
 */
export default defineConfig({
  cacheDir: ".vitest-cache",
  pack: {
    entry: { feod: "src/app/feod.ts" },
    outDir: "dist",
    format: ["esm"],
    target: "node20",
    platform: "node",
    dts: false,
    sourcemap: false,
    minify: false,
    deps: { alwaysBundle: [/^@o-feod\//, "ajv", "ajv-formats"] },
  },
});
