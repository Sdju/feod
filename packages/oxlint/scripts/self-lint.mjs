#!/usr/bin/env node
/**
 * Self-hosting lint: the package is checked by its own FEOD rules through plain Oxlint.
 *
 * `VP_VERSION` is set inside Vite+ managed shells and switches Oxlint to Vite+ mode, where it expects a
 * `lint` field in a `vite.config.*`. This config is a standalone Oxlint config, so the variable is removed.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const bin = join(dirname(require.resolve("oxlint/package.json")), "bin", "oxlint");
const env = { ...process.env };
delete env.VP_VERSION;

const result = spawnSync(process.execPath, [bin, "--config", "oxlint.config.ts", "src", "--deny-warnings"], {
  stdio: "inherit",
  env,
});
process.exit(result.status ?? 1);
