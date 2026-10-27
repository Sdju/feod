import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { runInfo } from "../src/commands/info/index.js";
import { collectProjectInfo, renderText } from "../src/modules/project/index.js";

const dirs: string[] = [];

function project(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "feod-info-"));
  dirs.push(dir);
  for (const [name, contents] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), contents);
  }
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const codes = (dir: string) => collectProjectInfo(dir).findings.map(finding => finding.code);

describe("collectProjectInfo", () => {
  it("lists layers and modules of a default project", () => {
    const dir = project({
      "src/app/entry.ts": "",
      "src/modules/Cart/index.ts": "",
      "src/modules/Cart/modules/Item/index.ts": "",
      "src/modules/Cart/pages/cart.vue": "",
    });
    const info = collectProjectInfo(dir);
    expect(info.configSource).toBeNull();
    expect(info.roots[0]!.layers.map(layer => [layer.name, layer.exists])).toContainEqual(["modules", true]);
    expect(info.roots[0]!.modules).toEqual([
      expect.objectContaining({ name: "Cart", entry: "index.ts", submodules: ["Item"], hasPages: true }),
    ]);
  });

  it("reads layer names from package.json#feod", () => {
    const dir = project({
      "package.json": JSON.stringify({ feod: { layerDirs: { global: "globals" } } }),
      "src/globals/env.d.ts": "",
    });
    const info = collectProjectInfo(dir);
    expect(info.configSource).toBe("package.json#feod");
    expect(info.roots[0]!.layers.find(layer => layer.role === "global")).toMatchObject({
      dir: "globals",
      exists: true,
    });
  });

  it("reports a module without a public entry and uncovered entries", () => {
    const dir = project({ "src/modules/Cart/api.ts": "", "src/utils/x.ts": "" });
    expect(codes(dir)).toEqual(expect.arrayContaining(["module-no-entry", "uncovered"]));
  });

  it("does not require an entry from transit modules", () => {
    const dir = project({
      "package.json": JSON.stringify({ feod: { transitModules: ["pm"] } }),
      "src/modules/pm/npm/index.ts": "",
    });
    expect(codes(dir)).not.toContain("module-no-entry");
  });

  it("flags a barrel in common unless the profile allows it", () => {
    const files = { "src/common/index.ts": "" };
    expect(codes(project(files))).toContain("common-index");
    const allowed = project({
      ...files,
      "feod.profile.md": "| Parameter | Value |\n|---|---|\n| common.allowIndex | true |\n",
    });
    expect(codes(allowed)).not.toContain("common-index");
  });

  it("reads the profile table and detects layer drift", () => {
    const dir = project({
      "feod.profile.md":
        "# FEOD profile\n\n| Parameter | Value |\n|-----------|-------|\n| modification | base |\n| layers | app, pages, modules, common, globals |\n",
      "src/app/entry.ts": "",
    });
    const info = collectProjectInfo(dir);
    expect(info.profile?.values).toMatchObject({ modification: "base" });
    expect(info.findings.map(finding => finding.code)).toContain("profile-layers");
  });

  it("reports a missing root as an error", () => {
    expect(collectProjectInfo(project({})).findings).toContainEqual(
      expect.objectContaining({ severity: "error", code: "root-missing" }),
    );
  });
});

describe("runInfo", () => {
  it("prints JSON and exit code 1 on error findings", () => {
    let output = "";
    const code = runInfo(["--root", project({}), "--json"], text => {
      output += text;
    });
    expect(code).toBe(1);
    expect(JSON.parse(output).findings.map((finding: { code: string }) => finding.code)).toContain("root-missing");
  });

  it("returns 2 for an invalid config", () => {
    let output = "";
    const dir = project({ "feod.config.json": JSON.stringify({ unknown: true }) });
    expect(
      runInfo(["--root", dir], text => {
        output += text;
      }),
    ).toBe(2);
    expect(output).toContain("unknown");
  });

  it("renders a readable report", () => {
    const text = renderText(collectProjectInfo(project({ "src/modules/Cart/index.ts": "" })));
    expect(text).toContain("Cart  index.ts");
    expect(text).toContain("profile: none");
  });
});
