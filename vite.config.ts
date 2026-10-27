import { defineConfig } from "vite-plus";

/**
 * Workspace-level Vite+ config.
 *
 * Each package under `packages/` keeps its own `vite.config.ts` with the `pack` (tsdown) and `test`
 * (vitest) blocks. Vite+ reads `fmt` and `lint` only from this file, so the shared format/lint
 * policy for `vp fmt`, `vp lint` and `vp check` lives here.
 *
 * Scope: the packages and the repository scripts. Documentation, example apps, the skill sources and
 * the generated skill (`skills/`, built by `pnpm run skill:pack`) are not touched.
 */
const ignorePatterns = [
  "**/dist/**",
  "**/node_modules/**",
  "**/.vitest-cache/**",
  "**/test/fixtures/**",
  "docs/**",
  "examples/**",
  "skill/**",
  "skills/**",
  ".cursor/**",
  "**/*.md",
  "**/*.json",
  "pnpm-lock.yaml",
  ".github/**",
];

export default defineConfig({
  staged: { "packages/**/*.{ts,mjs,js}": "vp fmt --no-error-on-unmatched-pattern" },
  fmt: {
    ignorePatterns,
    printWidth: 120,
    arrowParens: "avoid",
  },
  lint: {
    ignorePatterns,
    options: { typeAware: true, typeCheck: true },
  },
});
