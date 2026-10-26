import { readFileSync, writeFileSync } from "node:fs";

const source = new URL("../packages/eslint/src/modules/ProjectConfig/feod.schema.json", import.meta.url);
const target = new URL("../docs/public/feod.schema.json", import.meta.url);
const contents = readFileSync(source, "utf8");
if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== contents) {
    throw new Error("FEOD schema differs from the published copy. Run node scripts/sync-feod-schema.mjs.");
  }
} else {
  writeFileSync(target, contents);
}
