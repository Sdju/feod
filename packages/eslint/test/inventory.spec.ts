import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Linter } from "eslint";

import plugin, { buildInventory, clearInventoryState, createConfig, getInventory } from "../src/app/index.js";

const temporary: string[] = [];

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "feod-inventory-"));
  temporary.push(root);
  return root;
}

function write(root: string, filename: string, contents = "export {};\n") {
  const absolute = path.join(root, filename);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
}

function lint(config: ReturnType<typeof createConfig> | object[], rootDir: string, file: string) {
  return new Linter({ cwd: rootDir }).verify("export {};", Array.isArray(config) ? config : [config], {
    filename: path.join(rootDir, file),
  });
}

afterEach(() => {
  clearInventoryState();
  temporary.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true }));
});

describe("filesystem inventory", () => {
  it("classifies modules, entries, empty owners and uncovered files", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/app/main.js");
    write(rootDir, "src/modules/User/index.js");
    write(rootDir, "src/modules/User/ui/Avatar.js");
    fs.mkdirSync(path.join(rootDir, "src/modules/Hollow"), { recursive: true });
    write(rootDir, "src/modules/Assets/logo.png", "png");
    write(rootDir, "src/orphan/readme.md", "# hi");
    write(rootDir, "src/modules/Hub/Child/widget.js");

    const inventory = buildInventory({
      rootDir,
      srcRoot: "src",
      publicEntries: ["index.js"],
      transitModules: ["Hub"],
    });

    expect(inventory.uncovered).toEqual(["src/orphan/readme.md"]);
    expect(inventory.modules.map(module => module.ownerRoot)).toEqual([
      "src/modules/Assets",
      "src/modules/Hollow",
      "src/modules/Hub",
      "src/modules/Hub/Child",
      "src/modules/User",
    ]);
    expect(inventory.modules.find(module => module.ownerRoot === "src/modules/User")).toMatchObject({
      hasPublicEntry: true,
      isEmpty: false,
      isAssetOnly: false,
    });
    expect(inventory.modules.find(module => module.ownerRoot === "src/modules/Hollow")).toMatchObject({
      hasPublicEntry: false,
      isEmpty: true,
    });
    expect(inventory.modules.find(module => module.ownerRoot === "src/modules/Assets")).toMatchObject({
      hasPublicEntry: false,
      isAssetOnly: true,
    });
    expect(inventory.modules.find(module => module.ownerRoot === "src/modules/Hub/Child")).toMatchObject({
      kind: "transit-submodule",
      hasPublicEntry: false,
      names: ["Hub", "Child"],
    });
  });

  it("caches one walk per root options fingerprint", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/modules/User/index.js");
    const first = getInventory({ rootDir, srcRoot: "src" });
    write(rootDir, "src/modules/User/extra.js");
    const second = getInventory({ rootDir, srcRoot: "src" });
    expect(second).toBe(first);
    expect(second.modules[0]?.files).toEqual(["src/modules/User/index.js"]);
    clearInventoryState();
    const third = getInventory({ rootDir, srcRoot: "src" });
    expect(third).not.toBe(first);
    expect(third.modules[0]?.files).toEqual(["src/modules/User/extra.js", "src/modules/User/index.js"]);
  });

  it("reports missing public entries once per module", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/app/main.js");
    write(rootDir, "src/modules/Broken/ui.js");
    fs.mkdirSync(path.join(rootDir, "src/modules/Hollow"), { recursive: true });
    const config = createConfig(
      {
        modules: { requirePublicEntry: true, publicEntries: ["index.js"] },
      },
      { rootDir },
    );
    const first = lint(config, rootDir, "src/app/main.js");
    expect(first).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          messageId: "missingPublicEntry",
          message: expect.stringContaining("src/modules/Broken"),
        }),
        expect.objectContaining({
          messageId: "missingPublicEntry",
          message: expect.stringContaining("src/modules/Hollow"),
        }),
      ]),
    );
    expect(lint(config, rootDir, "src/modules/Broken/ui.js")).toEqual([]);
  });

  it("does not require an entry for a transit container, only for its submodules", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/app/main.js");
    write(rootDir, "src/modules/hub/_/core.js");
    write(rootDir, "src/modules/hub/good/index.js");
    write(rootDir, "src/modules/hub/bad/impl.js");
    const config = createConfig(
      {
        modules: { requirePublicEntry: true, publicEntries: ["index.js"] },
        transitModules: ["hub"],
      },
      { rootDir },
    );
    const messages = lint(config, rootDir, "src/app/main.js").map(message => message.message);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("src/modules/hub/bad");
  });

  it("reports forbidden empty and asset-only module names from inventory", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/app/main.js");
    fs.mkdirSync(path.join(rootDir, "src/modules/utils"), { recursive: true });
    write(rootDir, "src/modules/shared/logo.png", "png");
    const config = createConfig({ modules: { forbiddenNames: ["utils", "shared"] } }, { rootDir });
    expect(lint(config, rootDir, "src/app/main.js")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ messageId: "forbiddenModuleName", message: expect.stringContaining("'utils'") }),
        expect.objectContaining({ messageId: "forbiddenModuleName", message: expect.stringContaining("'shared'") }),
      ]),
    );
  });

  it("reports uncovered inventory files when enabled", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/app/main.js");
    write(rootDir, "src/orphan/note.md", "x");
    const config = createConfig({ inventory: { uncovered: true } }, { rootDir });
    expect(lint(config, rootDir, "src/app/main.js")).toEqual([
      expect.objectContaining({
        messageId: "unknownInventoryFile",
        message: expect.stringContaining("src/orphan/note.md"),
      }),
    ]);
  });

  it("keeps visited unknown-file diagnostics without filesystem scan by default", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/orphan/note.js");
    expect(
      lint(
        [
          {
            plugins: { "feod-structure": plugin },
            rules: { "feod-structure/no-unknown-files": ["error", { rootDir }] },
          },
        ],
        rootDir,
        "src/orphan/note.js",
      ),
    ).toEqual([expect.objectContaining({ messageId: "unknownFile" })]);
  });

  it("keeps one cached inventory per options fingerprint", () => {
    const rootDir = tempRoot();
    write(rootDir, "src/modules/User/index.js");
    const withEntries = { rootDir, srcRoot: "src", publicEntries: ["index.js"] };
    const withoutEntries = { rootDir, srcRoot: "src" };

    const first = getInventory(withEntries);
    const second = getInventory(withoutEntries);
    // Alternating callers (different rules) must not evict each other's inventory.
    expect(getInventory(withEntries)).toBe(first);
    expect(getInventory(withoutEntries)).toBe(second);
  });
});
