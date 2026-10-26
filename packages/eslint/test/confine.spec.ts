import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { Linter } from "eslint";
import tsParser from "@typescript-eslint/parser";

import { createConfig, FeodConfigError, type ConfinePolicy } from "../src/app/index.js";

const rootDir = path.resolve("/virtual/project");

function lint(code: string, file: string, policy: { confine: ConfinePolicy }, severity: "error" | "off" = "error") {
  const root = { extra: policy };
  const config = createConfig({ roots: { src: root, core: root } }, { rootDir });
  const rules = { ...config.rules };
  if (severity === "off") rules["feod-structure/confine"] = "off";
  return new Linter({ cwd: rootDir }).verify(code, [{
    ...config, rules, files: ["**/*.ts"], languageOptions: { parser: tsParser, sourceType: "module" },
  }], { filename: path.join(rootDir, file) }).filter(message => message.ruleId === "feod-structure/confine");
}

const platform = {
  confine: [{ name: "platform", imports: ["node:**", "node-pty", "ws"], allowedIn: ["core/os/**"] }],
};

describe("confine imports", () => {
  it("reports confined import forms outside allowed files", () => {
    const code = [
      `import fs from "node:fs";`, `import { x } from "node:fs/promises";`, `export * from "ws";`,
      `const a = require("node-pty");`, `const b = import("ws");`, `import c = require("ws");`,
      `type T = import("ws").WebSocket;`,
    ].join("\n");
    const messages = lint(code, "core/modules/a.ts", platform);
    expect(messages).toHaveLength(7);
    expect(messages[0]!.message).toContain("'node:fs' is confined by 'platform'");
  });

  it("allows matching files and ignores unrelated specifiers", () => {
    expect(lint(`import fs from "node:fs";`, "core/os/linux/x.ts", platform)).toEqual([]);
    expect(lint(`import a from "./node-pty"; import b from "vue";`, "core/modules/a.ts", platform)).toEqual([]);
  });

  it("treats type-only imports as violations unless allowTypeImports is set", () => {
    const code = `import type { Buffer } from "node:buffer"; import { type X } from "node:fs"; import { y } from "node:os";`;
    expect(lint(code, "core/modules/a.ts", platform)).toHaveLength(3);
    const lenient = { confine: [{ ...platform.confine[0]!, allowTypeImports: true }] };
    expect(lint(code, "core/modules/a.ts", lenient)).toHaveLength(1);
  });

  it("does not follow shadowed require or computed paths", () => {
    const code = `function f(require: (s: string) => void) { require("ws"); }\nconst n = "ws"; require(n);`;
    expect(lint(code, "core/modules/a.ts", platform)).toEqual([]);
  });

  it("forbids everywhere when allowedIn is empty", () => {
    const messages = lint(`import "ws";`, "src/a.ts", { confine: [{ name: "ban", imports: ["ws"] }] });
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain("no files");
  });
});

describe("confine literals", () => {
  const linux = { confine: [{ name: "linux", literals: ["^/proc(/|$)", "^(xdotool|wmctrl)$"], allowedIn: ["core/os/linux/**"] }] };

  it("reports matching string and template literals", () => {
    const code = [`const a = "/proc/1/stat";`, "const b = `/proc/self`;", `exec("xdotool");`, `const ok = "/process";`].join("\n");
    expect(lint(code, "src/a.ts", linux)).toHaveLength(3);
  });

  it("ignores templates with substitutions only where static text does not match", () => {
    expect(lint("const a = `/proc/${pid}`;", "src/a.ts", linux)).toHaveLength(1);
    expect(lint("const a = `${prefix}/stat`;", "src/a.ts", linux)).toEqual([]);
  });

  it("allows configured files", () => {
    expect(lint(`const a = "/proc/1";`, "core/os/linux/p.ts", linux)).toEqual([]);
  });

  it("does not report import sources as literals", () => {
    const code = `import a from "xdotool"; export { b } from "wmctrl";`;
    expect(lint(code, "src/a.ts", linux)).toEqual([]);
  });

  it("uses a custom message when configured", () => {
    const entry = { ...linux.confine[0]!, message: "Linux calls belong in the os adapter" };
    const [message] = lint(`const a = "xdotool";`, "src/a.ts", { confine: [entry] });
    expect(message!.message).toBe("FEOD: Linux calls belong in the os adapter");
  });
});

describe("confine configuration", () => {
  it("is disabled by default and when the list is empty", () => {
    const config = createConfig({ roots: { src: {} } }, { rootDir });
    expect(config.rules["feod-structure/confine"]).toBe("off");
    expect(lint(`import "ws";`, "src/a.ts", { confine: [] })).toEqual([]);
  });

  it("replaces inherited entries per root, with [] disabling them", () => {
    const config = createConfig({
      rootDefault: { extra: platform },
      roots: { src: {}, core: { extra: { confine: [] } } },
    }, { rootDir });
    const options = (config.rules["feod-structure/confine"] as [string, { roots: Record<string, { enabled: boolean }> }])[1];
    expect(options.roots.src!.enabled).toBe(true);
    expect(options.roots.core!.enabled).toBe(false);
  });

  it("rejects invalid entries", () => {
    const build = (confine: unknown) => () => createConfig({ roots: { src: { extra: { confine: confine as never } } } }, { rootDir });
    expect(build([{ name: "x" }])).toThrow(FeodConfigError);
    expect(build([{ name: "x", literals: ["("] }])).toThrow(/invalid regular expression/);
    expect(build([{ name: "x", imports: ["a"] }, { name: "x", imports: ["b"] }])).toThrow(/duplicate confine name/);
    expect(build([{ imports: ["a"] }])).toThrow(FeodConfigError);
  });

  it("applies the nearest root's policy", () => {
    const config = createConfig({ roots: {
      src: { extra: { confine: [{ name: "a", imports: ["ws"] }] } },
      core: { extra: { confine: [{ name: "b", imports: ["pg"] }] } },
    } }, { rootDir });
    const run = (file: string, code: string) => new Linter({ cwd: rootDir }).verify(code, [{
      ...config, files: ["**/*.ts"], languageOptions: { parser: tsParser, sourceType: "module" },
    }], { filename: path.join(rootDir, file) }).filter(m => m.ruleId === "feod-structure/confine");
    expect(run("src/a.ts", `import "ws"; import "pg";`)).toHaveLength(1);
    expect(run("core/a.ts", `import "ws"; import "pg";`)).toHaveLength(1);
  });
});

describe("confine targets", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "feod-confine-"));
  const write = (file: string) => {
    fs.mkdirSync(path.dirname(path.join(temp, file)), { recursive: true });
    fs.writeFileSync(path.join(temp, file), "export const x = 1;\n");
  };
  for (const file of ["core/os/index.ts", "core/os/impl/linux.ts", "core/launcher/index.ts", "src/app/entry.ts", "src/modules/a/index.ts"]) write(file);
  afterAll(() => fs.rmSync(temp, { recursive: true, force: true }));

  const policy = { confine: [{ name: "os-facade", targets: ["core/os/**"], allowedIn: ["core/os/**", "server/**"] }] };
  const run = (code: string, file: string, confine = policy) => {
    const config = createConfig({ roots: { src: { extra: confine }, core: { extra: confine }, server: { extra: confine } } }, { rootDir: temp });
    return new Linter({ cwd: temp }).verify(code, [{ ...config, files: ["**/*.ts"], languageOptions: { parser: tsParser, sourceType: "module" } }], {
      filename: path.join(temp, file),
    }).filter(message => message.ruleId === "feod-structure/confine");
  };

  it("judges relative and alias imports by the file they resolve to", () => {
    expect(run(`import { x } from "../os";`, "core/launcher/index.ts")).toHaveLength(1);
    expect(run(`import { x } from "../../../core/os/impl/linux";`, "src/modules/a/index.ts")).toHaveLength(1);
    expect(run(`import { x } from "@modules/a";`, "src/app/entry.ts")).toEqual([]);
  });

  it("covers dynamic, require and re-export forms", () => {
    const code = `export * from "../os"; const a = import("../os"); const b = require("../os");`;
    expect(run(code, "core/launcher/index.ts")).toHaveLength(3);
  });

  it("allows files in allowedIn, ignores unresolved paths and honors allowTypeImports", () => {
    expect(run(`import { x } from "./impl/linux";`, "core/os/index.ts")).toEqual([]);
    expect(run(`import { x } from "../os";`, "src/app/entry.ts", { confine: [{ ...policy.confine[0]!, allowedIn: ["src/**"] }] })).toEqual([]);
    expect(run(`import { x } from "../missing";`, "core/launcher/index.ts")).toEqual([]);
    expect(run(`import type { x } from "../os";`, "core/launcher/index.ts")).toHaveLength(1);
    const lenient = { confine: [{ ...policy.confine[0]!, allowTypeImports: true }] };
    expect(run(`import type { x } from "../os";`, "core/launcher/index.ts", lenient)).toEqual([]);
  });

  it("reports once when an import matches both imports and targets", () => {
    const both = { confine: [{ name: "both", imports: ["../os"], targets: ["core/os/**"], allowedIn: [] }] };
    expect(run(`import { x } from "../os";`, "core/launcher/index.ts", both)).toHaveLength(1);
  });
});
