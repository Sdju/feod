import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { ESLint } from 'eslint'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(import.meta.url)
const oxlintCli = path.join(path.dirname(require.resolve('oxlint/package.json')), 'bin/oxlint')
const eslint = new ESLint({ cwd: rootDir, fix: false })
const fixtureDirs = {
  module: fs.mkdtempSync(path.join(rootDir, 'src/modules/Product/boundary-check-')),
  page: fs.mkdtempSync(path.join(rootDir, 'src/pages/boundary-check-')),
  server: fs.mkdtempSync(path.join(rootDir, 'src/app/server/boundary-check-')),
}
const vue = source => `<script setup lang="ts">\nimport '${source}'\n</script>\n<template><div /></template>\n`
const ts = source => `import '${source}'\n`

// [место, файл, импорт, ожидаемое правило или null]
const cases = [
  ['module', 'BoundaryExample.vue', '@/modules/Cart', null],
  ['module', 'BoundaryExample.vue', '@/modules/Cart/store/cart', 'layer-imports'],
  ['server', 'boundary.get.ts', '@/modules/Product/server', null],
  ['page', 'BoundaryExample.vue', '@/modules/Product/server', 'confine'],
  ['page', 'BoundaryExample.vue', '@/modules/Product/data', 'layer-imports'],
]

try {
  for (const [where, file, source, rule] of cases) {
    const shouldFail = rule !== null
    const filename = path.join(fixtureDirs[where], file)
    fs.writeFileSync(filename, file.endsWith('.vue') ? vue(source) : ts(source))
    const [result] = await eslint.lintFiles([filename])
    const errors = result.messages.filter(message => message.ruleId === `feod-structure/${rule}`)
    assert.equal(errors.length, shouldFail ? 1 : 0, JSON.stringify(result.messages))
    assert.equal(result.errorCount, shouldFail ? 1 : 0, JSON.stringify(result.messages))
    assert.equal(result.warningCount, 0, JSON.stringify(result.messages))

    const oxlint = spawnSync(process.execPath, [oxlintCli, '--config', 'oxlint.config.ts', '--threads=1', '--no-ignore', '--format=json', filename], {
      cwd: rootDir, encoding: 'utf8', timeout: 15_000,
    })
    assert.equal(oxlint.error, undefined)
    assert.equal(oxlint.stderr, '')
    assert.equal(oxlint.status, shouldFail ? 1 : 0, oxlint.stdout)
    const diagnostics = JSON.parse(oxlint.stdout).diagnostics
    assert.equal(diagnostics.length, shouldFail ? 1 : 0, oxlint.stdout)
    if (shouldFail) assert.equal(diagnostics[0].code, `feod-structure(${rule})`)
    fs.rmSync(filename, { force: true })
    console.log(`${shouldFail ? `Rejected (${rule})` : 'Allowed'} in ${where} by both linters: ${source}`)
  }
} finally {
  for (const dir of Object.values(fixtureDirs)) fs.rmSync(dir, { recursive: true, force: true })
}
