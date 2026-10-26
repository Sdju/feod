# FEOD ESLint TODO Checklist

## Core layers and imports

* [x] FEOD layers graph: fixed chain `global | common -> modules -> pages -> app` with layer import checks.
* [x] Global import ban: `global` entities must not be imported.
* [x] Module public API: modules/submodules may be imported only via `index.*` (or module root).
* [x] Submodule access: a submodule can import implementation of its immediate parent; configurable per root.
* [x] Submodule isolation: a submodule cannot import internals of sibling submodules (only via public API).
* [x] Modules cross-imports: a module cannot import internals of another module (only public API).
* [x] Pages isolation: `pages` must not be imported anywhere except `app` (and only via public API if exists).
* [x] App isolation: `app` must not be imported by anyone.
* [x] Common index ban: disallow `common/**/index.*` (file presence + imports).
* [x] Common thinness: optional max depth for common subfolders.
* [x] Unknown files: disallow files outside known layers/patterns.
* [x] Ignored paths: allow/deny ignore zones.

## Pages structure rules

* [ ] Pages routing patterns: `[id]`, `[...param]`, `index.*` for `/`, `name.view.*` for named views.
* [x] Private page modules: `_page` alongside page or page folder, private to that page.
* [x] Page module external access ban: forbid importing private page modules from outside.
* [ ] Optional: warn to move page module to a module when it grows.

## Modules structure rules

* [x] Zig-zag imports ban: prevent `../../x/y` escapes across levels.
* [x] Visibility levels (default/transparent/open) with limits on depth.
* [x] Deep submodule isolation, with same-owner and immediate parent/child exceptions.
* [x] Transit modules: allow direct submodules under module root (no `modules/` folder) with public API checks.
* [x] Transit modules private core (`_`): allow only transit submodules to access.
* [x] Single-file modules: allow `modules/Foo.ts` as module root.
* [x] Module-local pages/routes: allow `modules/*/pages` + `routes.ts` without violating layer rules.

## Integrations / infra

* [x] Preset: `recommended`.
* [x] Preset: `strict`.
* [x] Resolver support: tsconfig paths / ESLint import-resolver.
* [x] Configurable alias (`@/`), root, and src path.
* [x] Cache/memoization for path resolution and module context.
* [x] Docs with examples and schema for options.

## Optional visited-file structure checks

* [x] Configurable globals allowed file patterns, disabled by default.
* [x] Configurable forbidden module owner names, disabled by default.
* [x] Complete filesystem inventory (empty and asset-only modules, required public entry).
* [x] Module-owner value cycle detection (`cycles.modules` / `no-module-cycles`).
* [x] File-level value cycle detection (`cycles.files` / `no-file-cycles`).

ho
