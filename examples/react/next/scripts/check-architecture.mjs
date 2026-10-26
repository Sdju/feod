import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { ESLint } from "eslint";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const oxlintCli = path.join(path.dirname(require.resolve("oxlint/package.json")), "bin/oxlint");
const eslint = new ESLint({ cwd: rootDir, fix: false });
const productFixture = path.join(rootDir, "src/modules/Product/BoundaryFixture.tsx");
const screenFixture = path.join(rootDir, "src/screens/boundary-fixture.tsx");

// [файл, импорт, ожидаемое правило или null]
const cases = [
  [productFixture, "@/modules/Cart", null],
  [productFixture, "@/modules/Cart/store/cart", "layer-imports"],
  [screenFixture, "@/modules/Product/server", null],
  [screenFixture, "@/modules/Product/data", "layer-imports"],
  [productFixture, "server-only", "confine"],
];

try {
  for (const [fixture, source, rule] of cases) {
    const shouldFail = rule !== null;
    fs.writeFileSync(fixture, `import '${source}'\nexport default function BoundaryFixture() { return <div /> }\n`);
    const [result] = await eslint.lintFiles([fixture]);
    const boundary = result.messages.filter((message) => message.ruleId === `feod-structure/${rule}`);
    assert.equal(boundary.length, shouldFail ? 1 : 0, JSON.stringify(result.messages));
    assert.equal(result.errorCount, shouldFail ? 1 : 0, JSON.stringify(result.messages));

    const oxlint = spawnSync(process.execPath, [oxlintCli, "--config", "oxlint.config.ts", "--threads=1", "--no-ignore", "--format=json", fixture], {
      cwd: rootDir, encoding: "utf8", timeout: 15_000,
    });
    assert.equal(oxlint.error, undefined);
    assert.equal(oxlint.stderr, "");
    assert.equal(oxlint.status, shouldFail ? 1 : 0, oxlint.stdout);
    const diagnostics = JSON.parse(oxlint.stdout).diagnostics;
    assert.equal(diagnostics.length, shouldFail ? 1 : 0, oxlint.stdout);
    if (shouldFail) assert.equal(diagnostics[0].code, `feod-structure(${rule})`);
    fs.rmSync(fixture, { force: true });
    const where = path.relative(rootDir, fixture);
    console.log(`${shouldFail ? `Rejected (${rule})` : "Allowed"} in ${where} through ESLint and Oxlint: ${source}`);
  }
} finally {
  fs.rmSync(productFixture, { force: true });
  fs.rmSync(screenFixture, { force: true });
}
