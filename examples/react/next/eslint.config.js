import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import playwright from "eslint-plugin-playwright";
import { configFromProject } from "@o-feod/eslint-structure-plugin";

export default [
  { ignores: [".next/**", "next-env.d.ts", "playwright-report/**", "test-results/**"] },
  ...tseslint.configs.recommended,
  { ...reactHooks.configs.flat.recommended, files: ["src/**/*.{ts,tsx}"] },
  { ...nextPlugin.configs["core-web-vitals"], files: ["src/**/*.{ts,tsx}"] },
  {
    ...configFromProject({ rootDir: fileURLToPath(new URL(".", import.meta.url)), preset: "strict" }),
    files: ["src/**/*.{ts,tsx}"],
  },
  { ...playwright.configs["flat/recommended"], files: ["e2e/**/*.spec.ts"] },
];
