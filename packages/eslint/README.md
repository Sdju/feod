# @o-feod/eslint-structure-plugin

ESLint plugin to enforce FEOD architecture and module boundaries.

> **FEOD is not just a methodology in itself: it is an attempt to give modular
> architecture a reasonable description, complete documentation and real tooling.**
> It does not impose one fixed architecture. You describe your variation of FEOD
> in the configuration, and this plugin strictly enforces it.

## Documentation

- [Linting overview](https://feod.dev/linting/): ESLint and Oxlint, presets, how it all fits together
- [ESLint setup](https://feod.dev/linting/eslint): installation and first run
- [FEOD configuration](https://feod.dev/linting/configuration): the `feod` section and `feod.config.json`
- [Rule reference](https://feod.dev/linting/rules/): every rule, with examples
- [Gradual migration](https://feod.dev/linting/migration): enabling FEOD in an existing project
- [Introduction to FEOD](https://feod.dev/base/briefly) and [variations](https://feod.dev/base/modifications)

For Oxlint, use [`@o-feod/oxlint-structure-plugin`](../oxlint/README.md).
Both packages share these rule implementations and preset rule sets.

## Rules

- `feod-structure/layer-imports`: enforces FEOD layer imports and module public API access.
- `feod-structure/no-common-index`: disallows `common/**/index.*` files and imports.
- `feod-structure/no-common-deep`: disallows deep nesting in `common` (configurable).
- `feod-structure/no-zigzag-imports`: disallows zig-zag relative imports between modules.
- `feod-structure/no-unknown-files`: disallows files outside known FEOD layers.
- `feod-structure/visibility-levels`: limits import depth for configured levels.
- `feod-structure/large-files`: optional (`extra.largeFiles`) size registry: split an oversized file or list it with a ceiling and a plan.
- `feod-structure/confine`: optional per-zone confinement of import specifiers and string literals to allowed files.
- `feod-structure/global-files`: optional allowed file patterns for the global role.
- `feod-structure/module-names`: optional forbidden module owner names (includes empty/asset-only via inventory).
- `feod-structure/module-entries`: optional required public entry for each module owner on disk.
- `feod-structure/no-module-cycles`: optional value-import cycles between module owners.
- `feod-structure/no-file-cycles`: optional value-import cycles between source files.
- `feod-structure/no-submodule-of-submodule`: restricts access to deep submodules outside their owner and immediate parent/child.
- `feod-structure/pages-private-modules`: limits imports into private page modules (`_page`).

## Usage (Flat config, ESM)

```js
// eslint.config.js
import feodStructure from "@o-feod/eslint-structure-plugin";

export default [
  {
    plugins: {
      "feod-structure": feodStructure,
    },
    rules: {
      "feod-structure/layer-imports": [
        "error",
        {
          rootDir: new URL(".", import.meta.url).pathname,
          aliasPrefix: "@",
          aliasRoot: "src",
        },
      ],
    },
  },
];
```

## Project configuration

Use a `feod` section in `package.json` or a standalone `feod.config.json`.
These APIs are available in this release; the older `0.1.0` version does not include them.

```js
import { configFromProject } from "@o-feod/eslint-structure-plugin";

export default [configFromProject({ preset: "strict" })];
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

## Options

Most rules accept the following options. Paths are resolved relative to
`rootDir` unless stated otherwise:

- `rootDir`: project root for absolute path resolution. In ESM flat config use
  `new URL(".", import.meta.url).pathname`.
- `srcRoot`: source root folder name (default: `"src"`).
- `layerDirs`: override layer folder names relative to `srcRoot`
  (e.g. `{ pages: "screens", modules: "features" }`).
- `aliasPrefix`: alias prefix for imports (default: `"@"`).
- `aliasRoot`: alias root folder (default: same as `srcRoot`).
- `layerAliases`: map of layer aliases (default: `@app`, `@pages`, `@modules`,
  `@common`, `@global`).
- `transitModules`: list of module names treated as FEOD transit modules
  (`modules/<name>/*` without `modules/` folder).
- `singleFileModules`: enable support for single-file modules in `modules/*`
  (default: `false`).
- `modulePages`: enable support for module-local pages (`modules/*/pages`).
- `ignore`: glob or list of globs to skip files/imports
  (e.g. `"src/**/__generated__/**"`).

Import rules check static imports, reexports, `require()` and dynamic `import()`
with a string literal source. Computed dynamic paths are not resolved.

Module internals and colocated tests may use any file layout. Imports from `app`,
`pages` or another module must use the target module's public API. Relative
imports of public module entries are allowed; relative crossings into another
module's internals are rejected by `no-zigzag-imports`. Aliased private access
is rejected by `layer-imports`.

`visibility-levels` uses the same resolver and alias options (`srcRoot`,
`layerDirs`, `aliasPrefix`, `aliasRoot`, `layerAliases`) as the layer rules.
Configure `levels` to enable depth limits; its default empty list does not impose
any limits, including in the strict preset.

## Private page modules

FEOD allows private modules inside `pages` with a `_` prefix. The rule
`pages-private-modules` enforces their scope:

- `/src/pages/_home` can be imported only by `/src/pages/home.*` files.
- `/src/pages/profile/_profile` can be imported by any file under `/src/pages/profile/**`.

Example:

```ts
// pages/home.vue
import { useHome } from "./_home";

// pages/profile/index.vue
import { ProfileHeader } from "./_profile";
```

## Transit modules

Transit modules expose direct submodules under `modules/<name>/` (without a
`modules/` folder). Use `transitModules` to opt in:

```js
// eslint.config.js
import feodStructure from "@o-feod/eslint-structure-plugin";

export default [
  {
    plugins: { "feod-structure": feodStructure },
    rules: {
      "feod-structure/layer-imports": [
        "error",
        {
          rootDir: new URL(".", import.meta.url).pathname,
          transitModules: ["package-manager"],
        },
      ],
    },
  },
];
```

The rule enforces public API imports for transit submodules and restricts
the private core (`modules/<name>/_/`) to those submodules.

## Single-file modules

Single-file modules live directly under `modules/` (for example,
`modules/logger.ts`). Enable support with:

```js
// eslint.config.js
import feodStructure from "@o-feod/eslint-structure-plugin";

export default [
  {
    plugins: { "feod-structure": feodStructure },
    rules: {
      "feod-structure/layer-imports": [
        "error",
        {
          rootDir: new URL(".", import.meta.url).pathname,
          singleFileModules: true,
        },
      ],
    },
  },
];
```

## Module pages

Module-local pages live under `modules/<name>/pages`. With `modulePages: true`,
they follow the same layer restrictions as `pages` (cannot be imported directly
by other layers), with one exception: the module `index.*` can import them to
expose routes to `app`.

```js
// eslint.config.js
import feodStructure from "@o-feod/eslint-structure-plugin";

export default [
  {
    plugins: { "feod-structure": feodStructure },
    rules: {
      "feod-structure/layer-imports": [
        "error",
        {
          rootDir: new URL(".", import.meta.url).pathname,
          modulePages: true,
        },
      ],
    },
  },
];
```

## Presets

```js
// eslint.config.js
import feodStructure from "@o-feod/eslint-structure-plugin";

export default [
  {
    plugins: {
      "feod-structure": feodStructure,
    },
    ...feodStructure.configs.recommended,
  },
];
```

```js
// eslint.config.js
import feodStructure from "@o-feod/eslint-structure-plugin";

export default [
  {
    plugins: {
      "feod-structure": feodStructure,
    },
    ...feodStructure.configs.strict,
  },
];
```

## Default layer rules

- `common` -> `common`
- `modules` -> `modules`, `common`
- `pages` -> `modules`, `common`
- `app` -> `app`, `pages`, `modules`, `common`
- `global` cannot be imported by other layers

The plugin only validates imports that resolve to `src/*` within the configured `rootDir`.

Import rules share one dependency visitor. Alongside imports and reexports, it
checks TypeScript `import type`, `export type`, `import('path')` type expressions
and `import value = require('path')`. Dynamic `import()` and unshadowed `require()`
accept string literals or template literals without substitutions.

The static file URL form `import(new URL('./literal.ts', import.meta.url).href)`
is also checked when `URL` is not shadowed. Other computed paths are skipped;
the plugin does not evaluate arbitrary expressions or forbid computed imports.
TypeScript and Vue files still require an appropriate ESLint parser.

These extended forms are available in this release. They are not included in
the older `0.1.0` package.

Release setup and trusted publishing: [publishing guide](https://github.com/Sdju/feod/blob/main/packages/PUBLISHING.md).

## Multiple roots

Source configuration supports inherited root settings:

```json
{
  "rootDefault": {
    "layerDirs": { "global": "globals" },
    "layerAliases": { "@core": "core/modules" }
  },
  "roots": {
    "src": { "dependencies": ["core"] },
    "server": { "dependencies": ["core"] },
    "core": {}
  }
}
```

`roots` defaults to `{ "src": {} }`. Root options override `rootDefault`;
`layerDirs`, `layerAliases` and `common` merge by field, arrays replace.
Root paths, custom aliases and ignore patterns are relative to the project root.
Built-in aliases are computed separately for each root. Nested roots use the
closest owner. Cross-root imports require a directional `dependencies` entry
and a public module API in the target root.

The legacy single-root `srcRoot` remains supported, but specifying both
`srcRoot` and `roots` is an error. Loader results always expose `config.roots`,
not `config.srcRoot`. ESLint and Oxlint use the same configuration and rules.
This API is available in this release; the older npm `0.1.0` package does not include it.

## Layer sets

Import `frontendLayers`, `backendLayers`, `libraryLayers` or `cliLayers` from
`@o-feod/eslint-structure-plugin/presets` and assign the object to
`rootDefault.layers` or a root's `layers` override. A root override replaces the
whole set. All four sets include `common`, which can import only itself; other
layers may import it. `cliLayers` mirrors `frontendLayers` with `commands`
in place of `pages`, preserving the `pages` role and private module checks.
Use `createConfig({ layers: cliLayers })` to select it.
These are ordinary configuration objects; spread to extend them or
create a completely custom set:

```ts
const layers = {
  entry: { dir: "bootstrap", imports: ["entry", "domain"] },
  domain: { imports: ["domain", "adapter"] },
  adapter: { imports: ["adapter"] },
};
createConfig({ rootDefault: { layers } });
```

`dir` defaults to the layer name. `imports` lists allowed target layers,
including the layer itself when internal imports should be permitted.
An optional `role` opts into FEOD structural checks: `modules`, `common`,
`pages`, `app` or `global`. Custom names do not implicitly assign roles.
Unknown import targets, duplicate roles and duplicate directories are rejected.
JSON configuration accepts the same objects; no hardcoded application modes exist.

### Parent and child access

The default policy requires public child APIs for parent imports, while children
may import their immediate parent's implementation directly. Configure this per
root with `submodules: { parentImports: "public", childImportsParent: "implementation" }`.
Both fields accept `public` or `implementation`; fields inherit independently
from `rootDefault`. Set `parentImports: "implementation"` for the previous parent
access behavior. Sibling internals remain private. The strict depth rule permits
same-module and immediate parent/child access at any depth, while unrelated deep
submodules remain inaccessible. Transit modules retain their separate policy.
Type-only imports follow the same rules. Direct parent imports can avoid barrel
initialization cycles; this policy does not detect general dependency cycles.

### Computed imports

Opt in with `imports: { computed: "forbid" }` in `rootDefault`, per-root settings,
or direct `layer-imports` options. The default `ignore` preserves existing behavior.
Unknown expressions in dynamic `import()` and unshadowed `require()` then report
an error. Strings, templates without substitutions, and literal relative file URLs
using the native `URL` and `import.meta.url` retain normal boundary checks.
Local/imported `require` and member calls are excluded. Constant variables are not
evaluated. `ignore` globs still apply; no dependency graph or file existence check
is introduced. ESLint retains the consumer's parser configuration for Vue scripts.

### Submodule visibility

Set `submodules.visibility` to `parent-only` to restrict access to a child's public
API to its immediate parent and its own files. `public` is the default and preserves
shallow public sibling/outsider imports. Immediate child-to-parent access still
follows `childImportsParent`, even when the parent is itself nested. Fields inherit
independently per root. Transit modules keep their separate semantics; strict depth
restrictions still apply. This is an access policy, not cycle detection.

The relative cross-top-level `no-zigzag-imports` rule now shares nearest ownership
and public entry classification with `layer-imports`. At deeper levels it recognizes
the actual owner's index; the separate strict depth rule still restricts access.
Public entry names default to `index.*`; `modules.publicEntries` opts into exact names. Existence checks are deferred.

### Optional structure checks

`globals.localImports` is an opt-in restriction on outgoing local dependencies
from layers with the `global` role: `allow` (default), `type-only`, or `forbid`.
It runs before cross-root checks and also covers unclassified local targets.
`type-only` accepts explicit type imports/reexports, exclusively type specifiers,
type import-equals and TS import type expressions. Mixed/empty declarations,
side-effect imports, dynamic imports and `require` are value dependencies;
being in a `.d.ts` file does not make a value import type-only.
Allowed types still obey layer, root and public-module access rules.
Resolved paths inside the project and relative/absolute imports are local;
`node_modules` paths, external bare packages and builtins are exempt.
Resolver/symlink limitations remain. Unresolved aliases are not guaranteed.
Use `imports.computed: "forbid"` separately to reject computed specifiers.
Use `imports.unresolved: "forbid"` to reject local imports that do not resolve to
an existing file (extensions/index and query/hash stripping included). External
packages, builtins and unsupported virtual/remote loaders are not treated as
missing locals. `resolveImport` exposes the typed resolver contract for tooling.
The importer root owns the policy; `allow` resets inheritance and `ignore`
still applies. `allowedFiles: []` does not reset this import policy.
Direct `layer-imports` options accept the same `globals` object:

```js
createConfig({ globals: { allowedFiles: ["**/*.d.ts"], localImports: "type-only" } });
```

`global-files` restricts visited global-layer file paths with `allowedFiles` glob
patterns relative to that layer. `module-names` checks module owner names against
an exact, case-sensitive `forbiddenNames` list, including ordinary nested modules,
transit children and configured single-file modules. Implementation directories
such as `User/utils` are unaffected. When enabled it also uses the run-scoped
filesystem inventory so empty and asset-only owners are reported once per run.

`module-entries` requires a public entry on disk for every directory / transit
module owner. Enable with `modules.requirePublicEntry: true`. Entry names follow
`modules.publicEntries` when set, otherwise `index.*`. Single-file modules are
exempt. Diagnostics are deduplicated once per owner per lint run.

`inventory.uncovered: true` makes `no-unknown-files` report files under the root
that sit outside known layers even when ESLint did not visit them. Default remains
visited-only. Inventory walks once per `rootDir`/`srcRoot`/options fingerprint;
`buildInventory` / `getInventory` are exported for tooling.

`cycles.modules: true` enables `no-module-cycles`. It scans module source files
from inventory, extracts static value dependencies (type-only edges are skipped),
resolves them offline and reports strongly connected components among module
owners once per run. `cycles.files: true` enables `no-file-cycles` for the same
value edges at file granularity across all FEOD layers; a cycle inside one module
owner is invisible to `cycles.modules` but caught by `cycles.files`.

`cycles.types: "include"` makes `cycles.modules` also count type-only imports
(Projector-style), except a module importing its own ancestor; the default
`"ignore"` skips all type-only edges. A transit container never needs its own
public entry for `modules.requirePublicEntry`; its submodules do.

Both presets disable `global-files`, `module-names`, `module-entries`,
`no-module-cycles` and `no-file-cycles`. `createConfig` / `configFromProject`
enable them as errors only when a matching role has nonempty
`globals.allowedFiles`, nonempty `modules.forbiddenNames`,
`modules.requirePublicEntry: true`, `cycles.modules: true`, or
`cycles.files: true`. Root overrides replace arrays; `[]` disables inherited
list checks. For example:

```js
createConfig({ rootDefault: {
  globals: { allowedFiles: ["**/*.d.ts", "**/*.d.mts", "**/*.d.cts"] },
  modules: { forbiddenNames: ["shared", "utils"], requirePublicEntry: true, publicEntries: ["index.ts"] },
  inventory: { uncovered: true },
  cycles: { modules: true, files: true },
} });
```

### Files outside explicit roots

Checks run only for files inside a configured root (`roots`, or the legacy
`srcRoot`); the nearest root owns a file. A file outside every root, such as
tests, scripts or tooling config, is not checked by any rule, so no `ignore`
list is needed for it. Use `ignore` only for generated files inside a root.

### Large-file registry (`extra.largeFiles`)

`extra` groups opt-in rules that are not FEOD structure itself (`large-files`,
`confine`): both presets leave them off and the configuration enables them. `extra.largeFiles`
enables `large-files`: a linted file over its limit (`thresholds` by extension
such as `".vue"`, with `default`, 400 when omitted) must either be split or be
listed in `files` as `"path/from/root.ts": { ceiling, plan }`. The ceiling
only goes down: growth past it, a file that shrank (lower the ceiling), a file
back within the limit (remove the entry) and a listed file that no longer
exists are all errors. Diagnostics name the choice (split or register), so
agents and people see the fork. Paths are POSIX, relative to the project root;
a root's `files` replaces the inherited registry.

```js
createConfig({ rootDefault: { extra: { largeFiles: {
  thresholds: { default: 400, ".vue": 500 },
  files: { "src/modules/dock/lib/layout.ts": { ceiling: 620, plan: "Extract panel math into dock/lib/panels.ts" } },
} } } });
```

`largeFilesRows({ rootDir, policy })` and `renderLargeFilesMarkdown(rows, options)`
(also exported by the Oxlint package) build a Markdown overview of the registry
with the rule's own line counter. Output location, title, intro and column
labels belong to the caller; call them from a script in your repository:

```js
import { writeFileSync } from "node:fs";
import { largeFilesRows, renderLargeFilesMarkdown } from "@o-feod/eslint-structure-plugin";

const rows = largeFilesRows({ rootDir: process.cwd(), policy: feod.rootDefault.extra.largeFiles });
writeFileSync("docs/large-files.md", renderLargeFilesMarkdown(rows, { title: "Large files" }));
```

### Confining imports and literals (`extra.confine`)

`extra.confine` lets a team keep chosen imports or text inside specific files, such as
Node-only packages or platform commands inside one adapter. Each entry has a
unique `name`, `imports` (picomatch globs matched against specifiers as written,
so `node:**` covers `node:fs/promises`), `targets` (picomatch globs on the
project-relative path a relative or alias import resolves to, so `../os` is judged
by where it lands; unresolved imports are ignored), `literals` (regular expression sources
tested against static strings and template text) and `allowedIn` (globs relative
to the project root; empty means nowhere). `allowTypeImports: true` ignores
type-only imports and `message` replaces the default diagnostic. Import sources
are never matched as literals. Computed `require`/`import` arguments and values
built at runtime are not seen. A nonempty `extra.confine` enables `confine` as an
error; root overrides replace the list and `[]` disables it.

```js
createConfig({ rootDefault: { extra: { confine: [
  { name: "node-only", imports: ["node:**", "ws"], allowedIn: ["core/modules/os/**"], allowTypeImports: true },
  { name: "linux", literals: ["^/proc(/|$)", "^xdotool$"], allowedIn: ["core/modules/os/modules/linux/**"] },
] } } });
```

These names and patterns are consumer policy, with no built-in blacklist. Direct
rule options use `allowedFiles`, `forbiddenNames`, `requirePublicEntry` and
`filesystem` (for uncovered inventory on `no-unknown-files`). Severity is
independent per rule: retain the generated options when changing an enabled rule
to `warn`. Configure ESLint files/parser for declaration extensions; FEOD supplies
no parser. Globals file checks do not change their outgoing import policy.

### Exact public entries

`modules.publicEntries: ["index.ts"]` restricts explicit public file imports to
configured basenames; paths/globs are rejected. Empty lists preserve legacy
`index.*` behavior and reset inherited configuration. The list also applies to
transit public APIs and is taken from the target root on cross-root imports.
`layer-imports` and `no-zigzag-imports` share this check; direct rule options use
`publicEntries`. Module directory shorthand remains accepted. Path checks are
separate from `modules.requirePublicEntry`, which asks inventory whether an
allowed entry file exists on disk. Own files, permitted parent implementation
imports and single-file modules are unaffected.

## Проверка собственной архитектуры

Исходники пакета организованы по FEOD. В `feod.config.js` расширяется
`libraryLayers`: слой `rules` имеет роль `pages` и импортирует только
`modules` и `common`. Слой `app` может импортировать `rules`; правила
изолированы друг от друга и от нижележащих слоёв.

`pnpm lint` собирает актуальный плагин и проверяет им `src` в строгом режиме,
включая публичные API модулей, циклы, неразрешённые импорты и файлы вне слоёв.
`pnpm test` и `prepublishOnly` также запускают самопроверку.

Размещение определяется предметной ответственностью, а не числом потребителей:

| Каталог | Ответственность |
| --- | --- |
| `app` | Сборка и регистрация плагина, его имя и публичные точки входа |
| `rules` | Изолированные адаптеры правил ESLint |
| `modules/Architecture` | Анализ архитектуры: импорты, модули, инвентарь и графы |
| `modules/Layers` | Модель слоёв FEOD и готовые наборы слоёв |
| `modules/ProjectConfig` | Загрузка, валидация и нормализация настроек; recommended/strict |
| `modules/Confine` | Модель и валидация ограничений доступа |
| `modules/LargeFiles` | Политика размеров файлов, реестр исключений и отчёты |
| `common` | Универсальные утилиты мемоизации и сопоставления путей с glob-шаблонами |

Пресеты и политики — часть предметной области линтера. Их переиспользование
несколькими правилами не делает их сущностями `common`. Конфигурация
сборки плагина принадлежит `app`, а работа с конфигурацией пользовательского
проекта — модулю `ProjectConfig`. Между модулями используются публичные API.

Full setup guides, rule examples and gradual migration: [ESLint and Oxlint documentation](https://feod.dev/linting/).
