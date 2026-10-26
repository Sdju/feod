# @o-feod/oxlint-structure-plugin

FEOD architecture rules for Oxlint. This package uses the rule implementations,
resolver, options and preset rule sets from `@o-feod/eslint-structure-plugin`.
It adds only Oxlint plugin registration and presets.

> **FEOD is not just a methodology in itself: it is an attempt to give modular
> architecture a reasonable description, complete documentation and real tooling.**
> It does not impose one fixed architecture. You describe your variation of FEOD
> in the configuration, and this plugin strictly enforces it.

## Documentation

- [Linting overview](https://feod.dev/linting/): ESLint and Oxlint, presets, how it all fits together
- [Oxlint setup](https://feod.dev/linting/oxlint): installation and first run
- [FEOD configuration](https://feod.dev/linting/configuration): the `feod` section and `feod.config.json`
- [Rule reference](https://feod.dev/linting/rules/): every rule, with examples
- [Gradual migration](https://feod.dev/linting/migration): enabling FEOD in an existing project
- [Introduction to FEOD](https://feod.dev/base/briefly) and [variations](https://feod.dev/base/modifications)

## Installation

```sh
pnpm add -D oxlint @o-feod/oxlint-structure-plugin
```

Requires Oxlint 1.86 or later within v1 and Node.js 20.19+ or 22.12+.
Oxlint's JavaScript plugin API is currently in alpha.

## Recommended preset

```ts
// oxlint.config.ts
import { defineConfig } from "oxlint";
import { recommended } from "@o-feod/oxlint-structure-plugin/configs";

export default defineConfig(recommended);
```

Run `pnpm exec oxlint src`. Paths use the current working directory as the
project root by default, so run Oxlint from your project root.

The `strict` export enables `visibility-levels` as well. Configure its `levels`
option to impose depth limits; the default empty list imposes no limits.

## Project configuration

Use a `feod` section in `package.json` or a standalone `feod.config.json`.
These APIs are available in this release; the older `0.1.0` version does not include them.

```ts
import { configFromProject } from "@o-feod/oxlint-structure-plugin/configs";

export default configFromProject({ preset: "strict" });
```

`rootDir` defaults to the current working directory; set it explicitly for
workspace packages. `preset` defaults to `recommended`. Both configuration
sources at once are an error. Invalid JSON, unknown fields and invalid values
throw `FeodConfigError` with the source path and field.

Use `createConfig(config, options)` for a validated inline object.
`loadFeodConfig({ rootDir })`, exported from the package root, returns
`{ rootDir, config, filepath }` with normalized defaults. Only explicit loader
calls read files; existing static presets keep their behavior. ESLint parsers
and resolver settings remain the consumer's responsibility.

See the [configuration contract](https://feod.dev/linting/configuration).

## Rule options and overrides

```ts
import { defineConfig } from "oxlint";
import { strict } from "@o-feod/oxlint-structure-plugin/configs";

export default defineConfig({
  ...strict,
  rules: {
    ...strict.rules,
    "feod-structure/layer-imports": ["error", {
      rootDir: process.cwd(),
      srcRoot: "source",
      layerAliases: { "#modules": "source/modules" },
    }],
    "feod-structure/visibility-levels": ["error", {
      levels: [{ name: "router", visibility: "default", maxDepth: 1 }],
    }],
  },
});
```

The presets only register FEOD rules; other Oxlint defaults remain active.
When combining plugins, include their entries in `jsPlugins` alongside
`...recommended.jsPlugins` rather than replacing the array.

## JSON configuration

```json
{
  "jsPlugins": [{
    "name": "feod-structure",
    "specifier": "@o-feod/oxlint-structure-plugin"
  }],
  "rules": {
    "feod-structure/layer-imports": "error"
  }
}
```

Save as `.oxlintrc.json`. Rules retain the `feod-structure/` namespace.

## Shared rules

All shared rules and their options are described in the
[ESLint package README](../eslint/README.md). Import rules check static imports,
reexports, TypeScript import types/import-equals, unshadowed `require()` and
dynamic `import()` with string literals or templates without substitutions.
Static `import(new URL('./literal.ts', import.meta.url).href)` is checked when
`URL` is not shadowed. These forms are available in this release; the older
`0.1.0` version does not include them. Other computed imports remain skipped.
Imports in Vue `<script>`
and `<script setup lang="ts">` are tested; this package does not check templates.
Custom ESLint parsers and processors are not carried over to Oxlint.

`settings["import/resolver"]` is passed to the shared resolver. Native Oxlint
`tsconfig` resolution does not automatically configure this JavaScript resolver;
use the shared FEOD alias options or configure a compatible import resolver.

## Development

From the workspace root:

```sh
pnpm --filter @o-feod/oxlint-structure-plugin... build
pnpm --filter @o-feod/oxlint-structure-plugin test
```

Tests build both packages and run the real Oxlint CLI against their package
exports. Builds keep the ESLint package as an external dependency; no rule
implementations are copied into this package.

Release setup and trusted publishing: [publishing guide](https://github.com/Sdju/feod/blob/main/packages/PUBLISHING.md).

`createConfig` and `configFromProject` also accept shared `rootDefault`/`roots`
settings described in the ESLint README. Per-root overrides, nested root
ownership and directional cross-root public API checks use the same code.
`srcRoot` and `roots` cannot be specified together.

`frontendLayers`, `backendLayers`, `libraryLayers` and `cliLayers` are exported from `@o-feod/oxlint-structure-plugin/presets`.
They are reexports of the ESLint objects, with no separate implementations.
All sets include `common`; `cliLayers` uses `commands` with the frontend `pages`
role and private module checks.

Parent/child access uses the same shared policy as ESLint. The default policy sets
`submodules.parentImports` to `public` and `submodules.childImportsParent` to
`implementation`; either field can be overridden per root. See the ESLint README
for migration and nested module behavior.

`imports: { computed: "forbid" }` opts into the shared computed import policy;
`ignore` is the default. Both Vue script blocks are checked by Oxlint. The same
literal and loader scope semantics apply as described in the ESLint README.

`submodules.visibility: "parent-only"` restricts ordinary child modules to their
owner and immediate parent/child relationships. The default `public` preserves
existing shallow public access. Oxlint uses the same helpers and policy as ESLint;
transit semantics and the separate strict depth rule are retained.

Optional `extra` rules `large-files` (`extra.largeFiles`) and `confine` (per-root `extra.confine` list of import globs / literal regexes
allowed only in listed files), `global-files`, `module-names`, `module-entries`, `no-module-cycles`
and `no-file-cycles` share the ESLint implementation. Configure
`globals.allowedFiles`, `modules.forbiddenNames`, `modules.requirePublicEntry`,
`cycles.modules` and `cycles.files` per root to enable these rules; empty lists /
false disable them and presets leave them off by default. `inventory.uncovered`
enables filesystem scanning for `no-unknown-files`.
`globals.localImports` (`allow` by default, `type-only`, `forbid`) also shares
the outgoing-local-import policy, including explicit type syntax, importer-root
inheritance and cross-root restrictions. It does not exempt allowed types from
module boundaries. External dependencies remain outside this policy; unresolved
and canonical-path limitations remain. See the ESLint README for details.
Generated severity is `error`; preserve its options when choosing `warn`.

`modules.publicEntries` selects exact public filenames, including transit and
cross-root target APIs. Empty lists preserve `index.*`; directory shorthand remains
accepted. Pair with `modules.requirePublicEntry` for on-disk existence via inventory.
The same shared check is used by ESLint.

## Проверка собственной архитектуры

Исходники пакета организованы по FEOD. В `feod.config.js` расширяется
`libraryLayers`: слой `rules` имеет роль `pages` и импортирует только
`modules` и `common`. Слой `app` может импортировать `rules`; правила
изолированы друг от друга и от нижележащих слоёв.

`pnpm lint` собирает актуальный плагин и проверяет им `src` в строгом режиме,
включая публичные API модулей, циклы, неразрешённые импорты и файлы вне слоёв.
`pnpm test` и `prepublishOnly` также запускают самопроверку.

Full setup guides, rule examples and gradual migration: [ESLint and Oxlint documentation](https://feod.dev/linting/).
