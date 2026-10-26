import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Linter } from "eslint";

import { checkLargeFile, createConfig, FeodConfigError, largeFilesRows, renderLargeFilesMarkdown, type FeodRootConfig } from "../src/app/index.js";
import { clearInventoryState } from "../src/modules/Architecture/index.js";

const temporary: string[] = [];
afterEach(() => {
  clearInventoryState();
  temporary.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true }));
});

const body = (lines: number) => "x;\n".repeat(lines);

function project(files: string[] = []) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "feod-large-"));
  temporary.push(rootDir);
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(rootDir, file)), { recursive: true });
    fs.writeFileSync(path.join(rootDir, file), "");
  }
  return rootDir;
}

function lint(rootDir: string, file: string, lines: number, root: FeodRootConfig) {
  const config = createConfig({ roots: { src: root } }, { rootDir });
  return new Linter({ cwd: rootDir }).verify(body(lines), [{ ...config, files: ["**/*.ts"] }], {
    filename: path.join(rootDir, file),
  }).filter(message => message.ruleId === "feod-structure/large-files").map(message => message.message);
}

const registry = (files: Record<string, { ceiling: number; plan: string }> = {}) => ({
  extra: { largeFiles: { thresholds: { default: 10, ".vue": 20 }, files } },
});

describe("checkLargeFile", () => {
  const policy = { thresholds: { default: 10, ".vue": 20 }, files: { "src/big.ts": { ceiling: 30, plan: "split" } } };

  it("applies extension thresholds", () => {
    expect(checkLargeFile("src/a.ts", 10, policy)).toBeUndefined();
    expect(checkLargeFile("src/a.ts", 11, policy)).toEqual({ id: "needsEntry", limit: 10 });
    expect(checkLargeFile("src/a.vue", 20, policy)).toBeUndefined();
    expect(checkLargeFile("src/a.vue", 21, policy)).toEqual({ id: "needsEntry", limit: 20 });
  });

  it("ratchets the registered ceiling down", () => {
    expect(checkLargeFile("src/big.ts", 31, policy)).toEqual({ id: "grew", ceiling: 30 });
    expect(checkLargeFile("src/big.ts", 30, policy)).toBeUndefined();
    expect(checkLargeFile("src/big.ts", 25, policy)).toEqual({ id: "shrank", ceiling: 30 });
    expect(checkLargeFile("src/big.ts", 10, policy)).toEqual({ id: "withinLimit", limit: 10 });
  });

  it("falls back to 400 lines without thresholds", () => {
    expect(checkLargeFile("a.ts", 400, {})).toBeUndefined();
    expect(checkLargeFile("a.ts", 401, {})).toEqual({ id: "needsEntry", limit: 400 });
  });
});

describe("large-files rule", () => {
  it("offers the split-or-register fork for an unregistered file", () => {
    const [message, ...rest] = lint(project(), "src/a.ts", 11, registry());
    expect(rest).toEqual([]);
    expect(message).toContain("src/a.ts has 11 lines, over the 10 limit");
    expect(message).toContain("Split it, or register it in extra.largeFiles.files");
  });

  it("stays quiet within the limit and for an exact ceiling", () => {
    const entry = { "src/big.ts": { ceiling: 15, plan: "split" } };
    expect(lint(project(["src/big.ts"]), "src/a.ts", 10, registry(entry))).toEqual([]);
    expect(lint(project(["src/big.ts"]), "src/big.ts", 15, registry(entry))).toEqual([]);
  });

  it("reports growth, shrinkage and a no-longer-needed entry", () => {
    const entry = { "src/big.ts": { ceiling: 15, plan: "split" } };
    const rootDir = project(["src/big.ts"]);
    expect(lint(rootDir, "src/big.ts", 16, registry(entry))[0]).toContain("grew to 16 lines, past its registry ceiling of 15");
    expect(lint(rootDir, "src/big.ts", 12, registry(entry))[0]).toContain("Lower its ceiling in extra.largeFiles.files from 15 to 12");
    expect(lint(rootDir, "src/big.ts", 9, registry(entry))[0]).toContain("Remove it from extra.largeFiles.files");
  });

  it("reports registered files that no longer exist once per run", () => {
    const entry = { "src/gone.ts": { ceiling: 15, plan: "split" } };
    const rootDir = project();
    expect(lint(rootDir, "src/a.ts", 1, registry(entry))).toEqual([expect.stringContaining("'src/gone.ts' is registered")]);
    expect(lint(rootDir, "src/b.ts", 1, registry(entry))).toEqual([]);
  });

  it("is off without extra.largeFiles and honors ignore", () => {
    const rootDir = project();
    expect(createConfig({ roots: { src: {} } }, { rootDir }).rules["feod-structure/large-files"]).toBe("off");
    expect(lint(rootDir, "src/a.ts", 999, {})).toEqual([]);
    expect(lint(rootDir, "src/gen/a.ts", 999, { ...registry(), ignore: ["src/gen/**"] })).toEqual([]);
  });
});

describe("extra.largeFiles configuration", () => {
  const build = (largeFiles: unknown) => () => createConfig({ roots: { src: { extra: { largeFiles } as never } } });

  it("requires a ceiling and a plan and valid thresholds", () => {
    expect(build({ files: { "a.ts": { ceiling: 10 } } })).toThrow(FeodConfigError);
    expect(build({ files: { "a.ts": { ceiling: 10, plan: "" } } })).toThrow(FeodConfigError);
    expect(build({ thresholds: { ts: 10 } })).toThrow(FeodConfigError);
    expect(build({ thresholds: { default: 0 } })).toThrow(FeodConfigError);
  });

  it("replaces the registry per root", () => {
    const config = createConfig({
      rootDefault: registry({ "a.ts": { ceiling: 20, plan: "split" } }),
      roots: { src: {}, core: { extra: { largeFiles: { files: {} } } } },
    });
    const roots = (config.rules["feod-structure/large-files"] as [string, { roots: Record<string, { largeFiles: { files: object } }> }])[1].roots;
    expect(Object.keys(roots.src!.largeFiles.files)).toEqual(["a.ts"]);
    expect(Object.keys(roots.core!.largeFiles.files)).toEqual([]);
  });
});

describe("large-files report", () => {
  const registered = {
    "src/small.ts": { ceiling: 50, plan: "keep | trim" },
    "src/big.vue": { ceiling: 90, plan: "split\ninto parts" },
    "src/gone.ts": { ceiling: 70, plan: "removed" },
  };

  it("lists registered files with current sizes, biggest ceiling first", () => {
    const rootDir = project();
    fs.mkdirSync(path.join(rootDir, "src"));
    fs.writeFileSync(path.join(rootDir, "src/small.ts"), body(12));
    fs.writeFileSync(path.join(rootDir, "src/big.vue"), body(80));
    const rows = largeFilesRows({ rootDir, policy: { thresholds: { default: 10, ".vue": 20 }, files: registered } });
    expect(rows).toEqual([
      { file: "src/big.vue", lines: 80, ceiling: 90, plan: "split\ninto parts", limit: 20 },
      { file: "src/gone.ts", lines: null, ceiling: 70, plan: "removed", limit: 10 },
      { file: "src/small.ts", lines: 12, ceiling: 50, plan: "keep | trim", limit: 10 },
    ]);
  });

  it("counts lines the way the rule does", () => {
    const rootDir = project(["a.ts"]);
    fs.writeFileSync(path.join(rootDir, "a.ts"), body(401));
    const [row] = largeFilesRows({ rootDir, policy: { files: { "a.ts": { ceiling: 450, plan: "x" } } } });
    expect(row).toMatchObject({ lines: 401, limit: 400 });
    expect(checkLargeFile("a.ts", row!.lines!, { files: { "a.ts": { ceiling: 450, plan: "x" } } })?.id).toBe("shrank");
  });

  it("renders a table with caller-provided wording and escaped cells", () => {
    const rows = [
      { file: "src/a.ts", lines: 80, ceiling: 90, plan: "keep | trim\nlater", limit: 10 },
      { file: "src/gone.ts", lines: null, ceiling: 70, plan: "x", limit: 10 },
    ];
    expect(renderLargeFilesMarkdown(rows)).toBe([
      "# Large files", "",
      "| File | Lines | Ceiling | Split plan |", "| --- | ---: | ---: | --- |",
      "| `src/a.ts` | 80 | 90 | keep \\| trim later |", "| `src/gone.ts` | — | 70 | x |", "",
    ].join("\n"));
    expect(renderLargeFilesMarkdown(rows.slice(0, 1), {
      title: "Реестр", intro: "Вводный текст.", columns: { file: "Файл", lines: "Строк", ceiling: "Потолок", plan: "План" }, missing: "нет",
    })).toBe([
      "# Реестр", "", "Вводный текст.", "",
      "| Файл | Строк | Потолок | План |", "| --- | ---: | ---: | --- |",
      "| `src/a.ts` | 80 | 90 | keep \\| trim later |", "",
    ].join("\n"));
    expect(renderLargeFilesMarkdown([])).toBe("# Large files\n\n| File | Lines | Ceiling | Split plan |\n| --- | ---: | ---: | --- |\n");
  });
});
