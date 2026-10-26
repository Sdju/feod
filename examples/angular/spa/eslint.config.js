import { fileURLToPath } from 'node:url'
import angular from 'angular-eslint'
import playwright from 'eslint-plugin-playwright'
import tseslint from 'typescript-eslint'
import { configFromProject } from '@o-feod/eslint-structure-plugin'

export default tseslint.config(
  {
    ignores: ['dist/**', 'out-tsc/**', 'playwright-report/**', 'test-results/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
  },
  {
    ...configFromProject({
      rootDir: fileURLToPath(new URL('.', import.meta.url)),
      preset: 'strict',
    }),
    files: ['src/**/*.{ts,mts}'],
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['e2e/**/*.spec.ts'],
  },
)
