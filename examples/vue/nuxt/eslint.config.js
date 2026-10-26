import { fileURLToPath } from 'node:url'
import { configFromProject } from '@o-feod/eslint-structure-plugin'
import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import pluginPlaywright from 'eslint-plugin-playwright'

export default [
  { name: 'app/files-to-lint', files: ['**/*.{ts,mts,tsx,vue}'] },
  {
    name: 'app/files-to-ignore',
    ignores: ['.nuxt/**', '.output/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
  ...pluginVue.configs['flat/recommended'],
  ...vueTsEslintConfig(),
  {
    ...configFromProject({ rootDir: fileURLToPath(new URL('.', import.meta.url)), preset: 'strict' }),
    name: 'app/feod-architecture',
    files: ['src/**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/vue-page-and-layout-names',
    files: ['src/app/error.vue', 'src/app/layouts/**/*.vue', 'src/pages/**/*.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  { ...pluginPlaywright.configs['flat/recommended'], files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'] },
]
