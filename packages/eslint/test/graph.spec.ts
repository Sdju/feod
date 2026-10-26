import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Linter } from "eslint";

import {
  buildFileGraph,
  buildModuleGraph,
  clearGraphState,
  clearInventoryState,
  createConfig,
  extractStaticDependencies,
} from "../src/app/index.js";

const temporary: string[] = [];

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "feod-cycles-"));
  temporary.push(root);
  return root;
}

function write(root: string, filename: string, contents: string) {
  const absolute = path.join(root, filename);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
}

afterEach(() => {
  clearGraphState();
  clearInventoryState();
  temporary.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true }));
});

describe("module dependency cycles", () => {
  it("extracts value imports and skips type-only edges", () => {
    const deps = extractStaticDependencies(`
      import type { A } from './a';
      import { b } from './b';
      export type { C } from './c';
      void import('./d');
      const x = require('./e');
      typeof import('./f');
    `);
    expect(deps.filter(item => !item.typeOnly).map(item => item.specifier).sort()).toEqual([
      "./b", "./d", "./e",
    ]);
    expect(deps.filter(item => item.typeOnly).map(item => item.specifier).sort()).toEqual([
      "./a", "./c", "./f",
    ]);
  });

  it("detects parent-child value cycles and ignores type-only back-edges", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/app/main.js", "export {};\n");
    write(rootDir, "src/modules/Parent/index.js", 'import { child } from "./modules/Child/index.js"; export const parent = child;\n');
    write(rootDir, "src/modules/Parent/modules/Child/index.js", 'import { parent } from "../../index.js"; export const child = parent;\n');

    const cyclic = buildModuleGraph({ rootDir, srcRoot: "src" });
    expect(cyclic.cycles.map(cycle => cycle.labels.join(" -> "))).toContain(
      "Parent -> Parent/modules/Child -> Parent",
    );

    write(rootDir, "src/modules/Parent/modules/Child/index.js", 'import type { parent } from "../../index.js"; export const child = "ok";\n');
    clearGraphState();
    clearInventoryState();
    const acyclic = buildModuleGraph({ rootDir, srcRoot: "src" });
    expect(acyclic.cycles).toEqual([]);
  });

  it("counts type-only module edges only when types are included, except into an ancestor", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/app/main.js", "export {};\n");
    write(rootDir, "src/modules/A/index.js", 'import { b } from "../B/index.js"; export const a = b;\n');
    write(rootDir, "src/modules/B/index.js", 'import type { a } from "../A/index.js"; export const b = 1;\n');
    write(rootDir, "src/modules/Parent/index.js", 'export const parent = 1;\n');
    write(rootDir, "src/modules/Parent/modules/Child/index.js", 'import type { parent } from "../../index.js"; export const child = 1;\n');
    write(rootDir, "src/modules/Parent/other.js", 'import { child } from "./modules/Child/index.js"; export const other = child;\n');

    expect(buildModuleGraph({ rootDir, srcRoot: "src" }).cycles).toEqual([]);
    clearGraphState();
    clearInventoryState();
    const included = buildModuleGraph({ rootDir, srcRoot: "src", typeEdges: "include" });
    expect(included.cycles.map(cycle => cycle.labels.join(" -> "))).toEqual(["A -> B -> A"]);
  });

  it("reports module cycles once through createConfig", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/app/main.js", "export {};\n");
    write(rootDir, "src/modules/A/index.js", 'import { b } from "../B/index.js"; export const a = b;\n');
    write(rootDir, "src/modules/B/index.js", 'import { a } from "../A/index.js"; export const b = a;\n');
    const config = createConfig({ cycles: { modules: true } }, { rootDir });
    const first = new Linter({ cwd: rootDir }).verify("export {};", [config], {
      filename: path.join(rootDir, "src/app/main.js"),
    });
    expect(first).toEqual([
      expect.objectContaining({
        messageId: "moduleCycle",
        message: expect.stringMatching(/A -> B -> A|B -> A -> B/),
      }),
    ]);
    expect(new Linter({ cwd: rootDir }).verify("export {};", [config], {
      filename: path.join(rootDir, "src/modules/A/index.js"),
    })).toEqual([]);
  });
});

describe("file dependency cycles", () => {
  it("detects file-level cycles that stay inside one module owner", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/app/main.js", "export {};\n");
    write(rootDir, "src/modules/User/a.js", 'import { b } from "./b.js"; export const a = b;\n');
    write(rootDir, "src/modules/User/b.js", 'import { a } from "./a.js"; export const b = a;\n');
    write(rootDir, "src/modules/User/index.js", 'export { a } from "./a.js";\n');

    const moduleGraph = buildModuleGraph({ rootDir, srcRoot: "src" });
    expect(moduleGraph.cycles).toEqual([]);

    const fileGraph = buildFileGraph({ rootDir, srcRoot: "src" });
    expect(fileGraph.cycles.map(cycle => cycle.labels.join(" -> "))).toEqual([
      "src/modules/User/a.js -> src/modules/User/b.js -> src/modules/User/a.js",
    ]);
  });

  it("reports file cycles once through createConfig", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/app/main.js", "export {};\n");
    write(rootDir, "src/common/left.js", 'import { right } from "./right.js"; export const left = right;\n');
    write(rootDir, "src/common/right.js", 'import { left } from "./left.js"; export const right = left;\n');
    const config = createConfig({ cycles: { files: true } }, { rootDir });
    const messages = new Linter({ cwd: rootDir }).verify("export {};", [config], {
      filename: path.join(rootDir, "src/app/main.js"),
    });
    expect(messages).toEqual([
      expect.objectContaining({
        messageId: "fileCycle",
        message: expect.stringContaining("src/common/left.js"),
      }),
    ]);
  });
});
