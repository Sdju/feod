# FEOD ESLint / Oxlint: setup, usage and repairs

## Discover the actual package/API

Inspect the consumer's package.json, lockfile, lint scripts, configuration files,
source layout, framework parsers, Node version and working directory. Resolve the
installed package rather than assuming workspace source equals an npm release.
Use its README, exports and declarations to choose configuration APIs.

Registry snapshot verified on 2026-10-26 against npm metadata:

| Package | npm latest | Exports in that release | Runtime |
| --- | --- | --- | --- |
| `@o-feod/eslint-structure-plugin` | `0.1.5` | root: plugin, `rules`, `configs`, `createConfig`, `configFromProject`, loader; `/presets` | Node >=18 |
| `@o-feod/oxlint-structure-plugin` | `0.1.5` | root: plugin, `rules`, loader; `/configs`: presets, `createConfig`, `configFromProject`; `/presets` | Node ^20.19.0 or >=22.12.0; Oxlint ^1.86.0 |

Both have a `bootstrap` dist-tag; normal installs use `latest`. Use the
`@o-feod` scope for both packages. Refresh these facts when installing or
upgrading; this is a dated snapshot.

```sh
npm view @o-feod/eslint-structure-plugin version dist-tags exports engines --json
npm view @o-feod/oxlint-structure-plugin version dist-tags exports engines peerDependencies --json
```

Primary package pages: [ESLint](https://www.npmjs.com/package/@o-feod/eslint-structure-plugin),
[Oxlint](https://www.npmjs.com/package/@o-feod/oxlint-structure-plugin).
Project configuration helpers exist from `0.1.5`; npm `0.1.0` lacks them.
Do not offer those APIs to a consumer until its resolved exports support them. If the registry is unavailable, report that limitation and use installed
artifacts without claiming they are npm latest.

## Install and configure the published API

Use the consumer's existing package manager; these examples use pnpm. Install in
the consuming workspace package. Keep existing general/framework rules, parsers,
processors, ignores and scripts when adding FEOD. Do not switch linters merely
to enable FEOD; if both run, choose one owner for FEOD diagnostics when practical.

```sh
pnpm add -D eslint @o-feod/eslint-structure-plugin
# For an Oxlint consumer:
pnpm add -D oxlint @o-feod/oxlint-structure-plugin
```

ESLint flat config (ESM; `.mjs` also works without package `type: module`):

```js
// eslint.config.mjs — append this block to existing framework configuration
import { fileURLToPath } from 'node:url'
import feod from '@o-feod/eslint-structure-plugin'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
export default [{
  files: ['src/**/*.{js,jsx,ts,tsx,vue,svelte}'],
  plugins: { 'feod-structure': feod },
  rules: {
    ...feod.configs.recommended.rules,
    'feod-structure/layer-imports': ['error', {
      rootDir, srcRoot: 'src', aliasPrefix: '@', aliasRoot: 'src',
      layerDirs: { global: 'globals' }, modulePages: true,
    }],
    'feod-structure/no-unknown-files': ['error', {
      rootDir, srcRoot: 'src', layerDirs: { global: 'globals' },
    }],
  },
}]
```

The glob selects files; it does not provide a TS, JSX, Vue or Svelte parser.
Use the project's framework configuration. Presets supply rule maps and do not
register the ESLint plugin. A later `rules` property replaces an earlier one:
merge preset rules explicitly. The example sets customized options on two rules;
when root/layer/alias settings differ from defaults, apply the supported options
to every affected rule, including zigzag, common and private-page rules.

Oxlint TypeScript config:

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint'
import { recommended } from '@o-feod/oxlint-structure-plugin/configs'

export default defineConfig(recommended)
```

For customized options merge `recommended.rules` before overrides, as with
ESLint. Preserve other plugins by merging their entries with
`recommended.jsPlugins`; replacing that array removes FEOD registration.
Alternatively use JSON (the two config formats are alternatives):

```json
{
  "jsPlugins": [{
    "name": "feod-structure",
    "specifier": "@o-feod/oxlint-structure-plugin"
  }],
  "rules": {
    "feod-structure/layer-imports": ["error", {
      "srcRoot": "src",
      "layerDirs": { "global": "globals" },
      "modulePages": true
    }]
  }
}
```

Save JSON as `.oxlintrc.json`. This example enables one rule; use the preset for
full coverage. Run from the consumer root or configure absolute `rootDir` in the
relevant rules. Use `fileURLToPath`, not URL `.pathname`, for filesystem paths.

## Project configuration API (check exports first)

In `0.1.5` and newer, ESLint root exports `createConfig`, `configFromProject`,
`loadFeodConfig`, `createRuleConfig`, `FeodConfigError`; Oxlint root exports the
loader/error and `/configs` exports `createConfig` and `configFromProject`.
Npm `0.1.0` has none of these helpers. Its static presets do not read `feod` JSON.

With an installed version supporting the helpers:

```js
// ESLint: parser configuration remains separate
import { fileURLToPath } from 'node:url'
import { configFromProject } from '@o-feod/eslint-structure-plugin'
export default [{
  ...configFromProject({
    rootDir: fileURLToPath(new URL('.', import.meta.url)), preset: 'recommended',
  }),
  files: ['src/**/*.{js,jsx,ts,tsx,vue,svelte}'],
}]
```

```ts
// Oxlint
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'oxlint'
import { configFromProject } from '@o-feod/oxlint-structure-plugin/configs'
export default defineConfig(configFromProject({
  rootDir: fileURLToPath(new URL('.', import.meta.url)), preset: 'recommended',
}))
```

Keep exactly one source: `package.json#feod` or `feod.config.json`. The loader
reads only that root, defaults to cwd, validates fields and rejects conflicting
sources. `createConfig(config, { rootDir, preset })` validates an inline object.
Static presets preserve their behavior and never automatically load this JSON.

Supported project fields in `packages/eslint/src/config/feod.schema.json`:
`$schema`, `srcRoot`, `aliasPrefix`, `aliasRoot`, `layerDirs`, `layerAliases`,
`ignore`, `common.maxDepth`, `transitModules`, `singleFileModules`, `modulePages`,
`levels`, `globals`, `modules` (including `publicEntries`, `forbiddenNames`,
`requirePublicEntry`), `inventory.uncovered`, `cycles.modules`, `cycles.files`,
`imports`, `submodules`, `roots`, `rootDefault`, `dependencies`, `layers`.
`rootDir` and `preset` are helper arguments, not JSON fields. `layerDirs` are
relative to srcRoot; alias targets are relative to project root. The default
global directory is `global`; configure `globals` explicitly.

`common.allowIndex`, `modules.allowDeepImports`, `modules.publicEntry`,
`pages.useFileBasedRouting`, `pages.privateModulesPrefix` are not supported by
this schema. Record such architectural choices in the skill/profile; do not
invent options to express them. Verify rule capabilities before relaxing a policy.

## Rules and useful limits

| Rule | Diagnose / repair |
| --- | --- |
| `layer-imports` | Layer direction and module public API; export needed entity at the module entry and update callers, or move/inject the dependency where it belongs |
| `no-common-index` | Common barrels/files; import the actual common entity or extract a domain module |
| `no-common-deep` | Common nesting; `maxDepth` (preset: 1), flatten or extract a module according to project policy |
| `no-zigzag-imports` | Relative crossings into another module's internals; relative public-entry imports are allowed by the implementation |
| `no-unknown-files` | Source files outside configured layers; `inventory.uncovered` also reports unvisited disk files |
| `visibility-levels` | Configured `levels` depth; recommended disables it, strict enables it but an empty levels list imposes no limit |
| `no-submodule-of-submodule` | Access into nested submodules; expose the required API at the appropriate boundary |
| `pages-private-modules` | Access to `_page` internals outside their owning page scope |
| `large-files` | Optional size registry (`extra.largeFiles`): split or register with ceiling + plan; ceilings only go down |
| `confine` | Optional (`extra.confine`): confine import globs / literal regexes to `allowedIn` files |
| `global-files` | Optional globals path allowlist |
| `module-names` | Optional forbidden owner names, including empty/asset-only via inventory |
| `module-entries` | Optional required public entry on disk (`modules.requirePublicEntry`) |
| `no-module-cycles` | Optional module-owner value cycles (`cycles.modules`); type-only edges skipped |
| `no-file-cycles` | Optional file-level value cycles across layers (`cycles.files`) |

Read the relevant rule's `meta.schema` for supported per-rule options; not all
rules accept every resolver/layer option. `transitModules`, `singleFileModules`
and `modulePages` configure layer-imports. With modulePages enabled, module
entry files can expose routes; outside callers use that entry.

Static imports, reexports, literal `require()` and literal dynamic `import()` are
checked. Computed dynamic paths are unresolved. Oxlint supports script imports
in Vue/Svelte; ESLint parsers/processors are not transferred and this adapter
does not check framework templates. Alias configuration in Vite/tsconfig or
native Oxlint resolution does not automatically configure the shared JS resolver.
Use FEOD aliases or compatible `settings['import/resolver']`.

## Diagnose and fix project lint results

1. Reproduce with the actual script/config from its workspace root; capture rule,
   file, line, import source and intended target. For ESLint inspect effective
   configuration with `--print-config <file>`. Check the file was actually linted.
2. Check rootDir, source/layer paths, aliases, ignored files, parser support and
   existing rule overrides. A silently unresolved import is not evidence of a
   valid dependency. Compare bundler resolution with the shared FEOD resolver.
3. Classify the failure: real architectural violation, wrong configuration,
   unsupported syntax/resolution or rule defect. Fix the smallest appropriate
   cause and update imports/reexports/tests affected by a move.
4. For real violations preserve public API boundaries and project intent. Do not
   turn off rules, widen ignores or use private deep imports just to clear lint.
   Explicitly requested policy exceptions should stay narrow and documented.
5. Run lint for changed files then the relevant project lint script; use typecheck,
   tests/build when changes affect exports, file placement or runtime behavior.
   Do not assume `--fix` can decide architectural moves or public API changes.

Useful consumer commands (adjust file names and existing scripts):

```sh
pnpm exec eslint --print-config src/app/entry.ts
pnpm exec eslint src
pnpm exec oxlint --config oxlint.config.ts src
```

If ESLint and Oxlint disagree, compare identical file trees, cwd/rootDir, enabled
FEOD rules, options, ignores and ESLint flat-config globs first. `No matching
configuration found` means the comparison did not exercise a rule. Distinguish
native Oxlint diagnostics from the FEOD namespace.

## Repair plugin implementation in this repository

- Shared logic: `packages/eslint/src/rules/`, `src/support/{resolve,layers,context,cache,ignore}.ts`.
- Presets/registration: `packages/eslint/src/{index.ts,config/recommended.ts,config/strict.ts}`.
- Project API/schema: `packages/eslint/src/config/{project.ts,feod.schema.json}`.
- Oxlint adapter: `packages/oxlint/src/{index.ts,configs.ts}`; keep rule implementations
  shared instead of copying ESLint rules into Oxlint.
- Regression suites: `packages/eslint/test/`, `packages/oxlint/test/{integration,project-config}.spec.ts`.
- Consumer examples: `examples/*/*/{eslint.config.*,oxlint.config.ts,feod.config.json}`;
  docs: `docs/tools/{eslint-plugin,oxlint-plugin,feod-config}.md`, package READMEs.

Create a minimal failing fixture and a valid counterpart. Include the reported
syntax/alias, importer and target files; add only cases that guard the actual
regression. Fix the shared rule/resolver for semantic bugs; change the adapter
only for registration/preset/API integration bugs. When adding an option, align
rule schemas, project schema/types, shared mapping, tests and docs as applicable.

Resolver changes need a native ESM package-entry check: CJS interop for
`eslint-module-utils/resolve` can silently bypass configured import resolvers.
Filesystem caches need tests for separate roots or file changes if affected.
For shared behavior changes, exercise both ESLint and the real Oxlint CLI against
built package exports; importing the rule source alone cannot establish parity.

From this repository root:

```sh
pnpm --filter @o-feod/oxlint-structure-plugin... build
pnpm --filter @o-feod/eslint-structure-plugin test
pnpm --filter @o-feod/oxlint-structure-plugin test
```

Build before ESLint package-entry tests; the Oxlint test script builds dependencies
itself. Run a focused test during iteration, then relevant package suites and
consumer lint. A consumer installed from npm still uses the published code after
local source edits: use a scoped workspace dependency or temporary built artifact
when testing a repair, and state that the fix is not yet released. Publishing is
a separate user task.

Report the actual version/API used, cause, changed files and completed checks.
An environmental `EPERM`/network failure is not a plugin regression; report checks
that could not run instead of changing code to accommodate the environment.
