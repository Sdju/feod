import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { FeodConfigError, frontendLayers, loadFeodConfig, normalizeFeodConfig } from "../src/app/index.js";

const dirs: string[] = [];
const project = (files: Record<string, string>) => {
  const dir = mkdtempSync(join(tmpdir(), "feod-config-"));
  dirs.push(dir);
  for (const [name, contents] of Object.entries(files)) writeFileSync(join(dir, name), contents);
  return dir;
};
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("loadFeodConfig", () => {
  it("uses defaults without any config source", () => {
    const loaded = loadFeodConfig({ rootDir: project({}) });
    expect(loaded.filepath).toBeUndefined();
    expect(Object.keys(loaded.config.roots)).toEqual(["src"]);
    expect(loaded.config.roots.src!.layerDirs.modules).toBe("modules");
  });

  it("reads package.json#feod", () => {
    const dir = project({ "package.json": JSON.stringify({ feod: { layerDirs: { global: "globals" } } }) });
    const loaded = loadFeodConfig({ rootDir: dir });
    expect(loaded.filepath).toBe(join(dir, "package.json"));
    expect(loaded.config.roots.src!.layerDirs.global).toBe("globals");
  });

  it("rejects two configuration sources", () => {
    const dir = project({ "package.json": JSON.stringify({ feod: {} }), "feod.config.json": "{}" });
    expect(() => loadFeodConfig({ rootDir: dir })).toThrow(/keep one source/);
  });
});

describe("normalizeFeodConfig", () => {
  it("rejects unknown fields with a readable path", () => {
    expect(() => normalizeFeodConfig({ nope: 1 }, "inline")).toThrow(FeodConfigError);
    expect(() => normalizeFeodConfig({ nope: 1 }, "inline")).toThrow(/\/nope/);
  });

  it("falls back to the frontend layer set", () => {
    const root = normalizeFeodConfig({}, "inline").roots.src!;
    expect(Object.keys(root.layers)).toEqual(Object.keys(frontendLayers));
  });

  it("rejects a root that escapes the project", () => {
    expect(() => normalizeFeodConfig({ roots: { "../x": {} } }, "inline")).toThrow();
  });
});
