import parser from "@typescript-eslint/parser";
import { createConfig } from "./dist/index.mjs";
import feod from "./feod.config.js";
import { fileURLToPath } from "node:url";

export default [{
  files: ["src/**/*.ts"],
  languageOptions: { parser },
  ...createConfig(feod, { rootDir: fileURLToPath(new URL(".", import.meta.url)), preset: "strict" }),
}];
