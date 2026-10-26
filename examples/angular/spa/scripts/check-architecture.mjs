import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { ESLint } from 'eslint'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(import.meta.url)
const oxlintCli = path.join(path.dirname(require.resolve('oxlint/package.json')), 'bin/oxlint')
const eslint = new ESLint({ cwd: rootDir, fix: false })
const fixtureDir = fs.mkdtempSync(path.join(rootDir, 'src/modules/Product/boundary-check-'))
const filename = path.join(fixtureDir, 'BoundaryExample.ts')

try {
  for (const [source, shouldFail] of [
    ['@/modules/Cart', false],
    ['@/modules/Cart/store/cart.service', true],
  ]) {
    const code = `import { Component, inject } from '@angular/core'
import { CartService } from '${source}'

@Component({ selector: 'app-boundary-example', standalone: true, template: '<span></span>' })
export class BoundaryExample {
  readonly cart = inject(CartService)
}
`
    fs.writeFileSync(filename, code)
    const [result] = await eslint.lintFiles([filename])
    const eslintBoundary = result.messages.filter(message => message.ruleId === 'feod-structure/layer-imports')
    assert.equal(eslintBoundary.length, shouldFail ? 1 : 0, JSON.stringify(result.messages))
    assert.equal(result.errorCount, shouldFail ? 1 : 0, JSON.stringify(result.messages))
    assert.equal(result.warningCount, 0, JSON.stringify(result.messages))

    const oxlint = spawnSync(process.execPath, [
      oxlintCli, '--config', 'oxlint.config.ts', '--threads=1', '--no-ignore', '--format=json', filename,
    ], {
      cwd: rootDir,
      encoding: 'utf8',
      timeout: 15_000,
    })
    assert.equal(oxlint.error, undefined)
    assert.equal(oxlint.stderr, '')
    assert.equal(oxlint.status, shouldFail ? 1 : 0, oxlint.stdout)
    const diagnostics = JSON.parse(oxlint.stdout).diagnostics
    assert.equal(diagnostics.length, shouldFail ? 1 : 0, oxlint.stdout)
    if (shouldFail) {
      assert.equal(diagnostics[0].code, 'feod-structure(layer-imports)')
      console.log(`ESLint: ${eslintBoundary[0].ruleId}: ${eslintBoundary[0].message}`)
      console.log(`Oxlint: ${diagnostics[0].code}: ${diagnostics[0].message}`)
    } else {
      console.log(`Public module API import allowed by both linters: ${source}`)
    }
  }
  console.log('Both linters reject private module imports and allow public APIs.')
} finally {
  fs.rmSync(fixtureDir, { recursive: true, force: true })
}
