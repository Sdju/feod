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
const probeDir = fs.mkdtempSync(path.join(rootDir, 'src/modules/Product/boundary-check-'))
const filename = path.join(probeDir, 'BoundaryProbe.svelte')

try {
  for (const [source, shouldFail] of [
    ['@/modules/Cart', false],
    ['@/modules/Cart/store/cart.svelte', true],
  ]) {
    fs.writeFileSync(filename, `<script lang="ts">\nimport '${source}'\n</script>\n<div />\n`)
    const [result] = await eslint.lintFiles([filename])
    const boundaries = result.messages.filter(message => message.ruleId === 'feod-structure/layer-imports')
    assert.equal(boundaries.length, shouldFail ? 1 : 0, JSON.stringify(result.messages))
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
    if (shouldFail) {
      assert.equal(diagnostics[0].code, 'feod-structure(layer-imports)')
      console.log(`ESLint ${boundaries[0].ruleId} and Oxlint ${diagnostics[0].code} reject private imports.`)
    } else {
      console.log(`Both linters allow the public import ${source}.`)
    }
  }
  console.log('Public/private boundary probes passed in ESLint and Oxlint; Oxlint analyzes Svelte script blocks only.')
} finally {
  fs.rmSync(probeDir, { recursive: true, force: true })
}
