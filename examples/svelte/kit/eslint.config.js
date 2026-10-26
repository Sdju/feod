import { fileURLToPath } from 'node:url'
import tseslint from 'typescript-eslint'
import svelte from 'eslint-plugin-svelte'
import playwright from 'eslint-plugin-playwright'
import { configFromProject } from '@o-feod/eslint-structure-plugin'

export default [
  { ignores: ['.svelte-kit/**', 'build/**', 'dist/**', 'playwright-report/**', 'test-results/**'] },
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.svelte'] } },
  },
  {
    ...configFromProject({ rootDir: fileURLToPath(new URL('.', import.meta.url)), preset: 'strict' }),
    files: ['src/**/*.{ts,svelte}'],
  },
  { ...playwright.configs['flat/recommended'], files: ['e2e/**/*.spec.ts'] },
]
