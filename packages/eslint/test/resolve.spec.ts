import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Rule } from "eslint";

import {
  isMissingLocalImport,
  resolveExistingPath,
  resolveImport,
  resolveImportPath,
  type ResolveOptions,
} from "../src/modules/Architecture/index.js";

const temporary: string[] = [];

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "feod-resolve-"));
  temporary.push(root);
  return root;
}

function write(root: string, filename: string, contents = "export {};\n") {
  const absolute = path.join(root, filename);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
  return absolute;
}

function contextStub(rootDir: string): Rule.RuleContext {
  return {
    options: [{ rootDir }],
    settings: {},
    getFilename: () => path.join(rootDir, "src/app/main.js"),
  } as unknown as Rule.RuleContext;
}

function options(rootDir: string, overrides: Partial<ResolveOptions> = {}): ResolveOptions {
  return {
    rootDir,
    aliasPrefix: "@",
    aliasRoot: "src",
    srcRoot: "src",
    layerAliases: { "@modules": "src/modules" },
    crossRoot: true,
    ...overrides,
  };
}

afterEach(() => temporary.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true })));

describe("resolver contract", () => {
  it("resolves relative and alias targets with extensions and canonical symlinks", () => {
    const rootDir = tempRoot();
    const target = write(rootDir, "src/modules/User/index.js");
    const linkDir = path.join(rootDir, "src/modules/Linked");
    fs.mkdirSync(path.dirname(linkDir), { recursive: true });
    fs.symlinkSync(path.dirname(target), linkDir, "dir");
    write(rootDir, "src/app/main.js");
    const filename = path.join(rootDir, "src/app/main.js");
    const context = contextStub(rootDir);

    const relative = resolveImport("../modules/User/index.js", context, filename, options(rootDir));
    expect(relative).toMatchObject({ status: "resolved", exists: true });
    if (relative.status === "resolved") {
      expect(fs.existsSync(relative.canonical)).toBe(true);
    }

    const aliased = resolveImport("@modules/User", context, filename, options(rootDir));
    expect(aliased).toMatchObject({ status: "resolved", exists: true });

    const hashAlias = resolveImport(
      "#modules/User",
      context,
      filename,
      options(rootDir, {
        layerAliases: { "#modules": "src/modules" },
      }),
    );
    expect(hashAlias).toMatchObject({ status: "resolved", exists: true, via: "alias" });

    const linked = resolveImport("../modules/Linked/index.js", context, filename, options(rootDir));
    expect(linked.status).toBe("resolved");
    if (linked.status === "resolved") {
      expect(path.resolve(linked.canonical)).toBe(path.resolve(target));
    }
  });

  it("strips query/hash suffixes before resolution", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/modules/User/index.js");
    write(rootDir, "src/app/main.js");
    const filename = path.join(rootDir, "src/app/main.js");
    const result = resolveImport(
      "../modules/User/index.js?raw#section",
      contextStub(rootDir),
      filename,
      options(rootDir),
    );
    expect(result).toMatchObject({
      status: "resolved",
      exists: true,
      query: "?raw",
      hash: "#section",
    });
  });

  it("classifies builtins, packages, virtual and missing locals", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/app/main.js");
    const filename = path.join(rootDir, "src/app/main.js");
    const context = contextStub(rootDir);
    const opts = options(rootDir);

    expect(resolveImport("node:fs", context, filename, opts)).toMatchObject({ status: "external", via: "builtin" });
    expect(resolveImport("lodash", context, filename, opts)).toMatchObject({ status: "external", via: "package" });
    expect(resolveImport("virtual:feod", context, filename, opts)).toMatchObject({
      status: "unsupported",
      reason: "virtual",
    });
    expect(resolveImport("https://example.com/x.js", context, filename, opts)).toMatchObject({
      status: "unsupported",
      reason: "remote",
    });

    const missing = resolveImport("../modules/Missing/index.js", context, filename, opts);
    expect(missing).toMatchObject({ status: "unresolved", candidate: expect.stringContaining("modules/Missing") });
    expect(isMissingLocalImport(missing)).toBe(true);
    expect(resolveImportPath("../modules/Missing/index.js", context, filename, opts)).toEqual(
      (missing as { candidate: string }).candidate,
    );
  });

  it.each([
    [".js", ".ts"],
    [".js", ".tsx"],
    [".jsx", ".tsx"],
    [".mjs", ".mts"],
    [".cjs", ".cts"],
  ])("resolves runtime %s imports to TypeScript %s sources", (runtime, source) => {
    const rootDir = tempRoot();
    const target = write(rootDir, `src/modules/User/index${source}`);
    const filename = write(rootDir, "src/app/main.ts");
    expect(
      resolveImport(`../modules/User/index${runtime}`, contextStub(rootDir), filename, options(rootDir)),
    ).toMatchObject({ status: "resolved", canonical: target });
    const runtimeFile = write(rootDir, `src/modules/User/index${runtime}`);
    expect(resolveExistingPath(runtimeFile)).toBe(runtimeFile);
  });

  it("resolveExistingPath finds index files under directories", () => {
    const rootDir = tempRoot();
    const index = write(rootDir, "src/modules/User/index.js");
    expect(resolveExistingPath(path.join(rootDir, "src/modules/User"))).toBe(index);
    expect(resolveExistingPath(path.join(rootDir, "src/modules/User/index"))).toBe(index);
  });
});
