import { fileURLToPath } from 'node:url'
import { defineConfig } from 'oxlint'
import { configFromProject } from '@o-feod/oxlint-structure-plugin/configs'

export default defineConfig({
  ...configFromProject({
    rootDir: fileURLToPath(new URL('.', import.meta.url)),
    preset: 'strict',
  }),
})
