---
name: feod
description: >-
  Organizes projects structure using FEOD methodology:
  app/pages/modules/common/global layers, import rules, modules with a public API.
  Also helps install, configure and use FEOD ESLint/Oxlint plugins, diagnose
  lint errors, fix project violations and repair plugin rules.
---

> For locking a project profile, follow [feod-init.md](feod-init.md).
> Plugin setup, lint diagnosis and rule fixes do not require profile initialization.

# FEOD (Fractal Entity Oriented Design) — creating and maintaining projects

## Core idea

FEOD combines **modular** and **layered** approaches: the center is **modules**; layers (app/pages/common/global) are tools for modularity, not abstraction layers.

Three pillars: **modularity**, **fractality** (submodules in `modules/<Name>/modules/`).

FEOD ≠ FSD. `common` ≠ FSD `shared`: common is a staging area for entities that are not yet a module. Entities routinely **move** between layers as the project grows.

## Layers and imports

```
common → modules → pages → app
global — never imported in code (available without import; .d.ts via tsconfig)
```

| Layer | Purpose | Imports | Imported by |
|-------|---------|---------|-------------|
| **global** | shims, polyfills, `.d.ts` | — | nobody (rare init in app — exception) |
| **common** | small reusable entities, usually 1 file | common | modules, pages, app |
| **modules** | business logic, isolated modules | common, modules (only `index.ts`) | modules, pages, app |
| **pages** | URL → component, thin layer | common, modules | app only |
| **app** | bootstrap, router, layouts, integrations | common, modules, pages | nobody |

**Hard rules:**
- `index.ts` / barrel — **only** the module public API. In `common` it is **forbidden** by default (`allowIndex: false`); docs allow an exception, but the agent should avoid it.
- Cross-module imports — **only** via `@/modules/<Name>` → `index.ts`.
- Cross-level imports — via `@/` alias (not `../../`).
- In-level / in-module — relative paths are fine.
- Submodules: a submodule may import its parent (exception, avoid); from outside — public API only.
- Zigzag imports between modules — forbidden.
- `common` → modules — only via **IoC** (interface + injection from app), not a direct import.

Alternative layer names (same rules): `boot`≈app, `views`/`routes`≈pages, `shared`≈common (FEOD semantics, not FSD).

## Base structure (Vue SPA)

```
src/
  app/
    entry.ts
    router.ts          # or router/
    layouts/
    config/
    integrations/      # external services; docs examples also use externals/
    ui/                # layout pieces (Header, Footer), not reusable domain logic
    styles/
    assets/
  pages/
    index.vue
    [id].vue
    [...404].vue
    (group)/           # grouping with no URL effect (as in examples)
    _pageName/         # private page module (optional)
  modules/
    FeatureName/
      components/ | ui/
      composables/
      api/
      store/
      types/
      pages/           # module pages (preferred over top-level pages)
      modules/         # submodules (fractal); avoid nesting deeper than 3 levels
      index.ts         # public API
  common/
    ui/                # primitives (Button), not a design system
    composables/
    utilities/
    types/
    constants/
    stores/            # optional: shared stores with no domain
  globals/             # or global/ — configured in feod.config
    vue-router.d.ts
```

Layer names are configured in `feod.config` — import rules stay the same. Top-level `pages/` is **optional**: if everything maps to module pages, you can skip the top level (keep 404/about).

### Project configuration

For versions exporting `configFromProject`, keep lint configuration in one source:
`package.json#feod` or `feod.config.json`. Static presets in npm `0.1.0` do not
read either source; pass options to rules explicitly instead.

```json
{
  "feod": {
    "srcRoot": "src",
    "aliasPrefix": "@",
    "layerDirs": { "global": "globals" },
    "common": { "maxDepth": 1 },
    "modulePages": true
  }
}
```

Keep architectural policies such as routing conventions in the project profile;
only supported lint options belong in this JSON. See [lint-plugins.md](lint-plugins.md)
for version checks and the configuration contract.

### Alias (Vite)

```ts
resolve: {
  alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
}
```

## Workflow: add a module

1. Create `src/modules/<PascalCase>/` with an internal structure driven by the domain (FEOD does not dictate internals — only `index.ts` and optionally `modules/`).
2. Export **only what is needed** from `index.ts`.
3. Internal files — **must not** be imported from outside.
4. If the module grows — `modules/<Name>/modules/<Sub>/`; do not go deeper than ~3 nesting levels without justification.
5. If the module is needed by only one page — prefer `modules/<Name>/pages/`; `pages/_<page>/` — use sparingly.
6. Cross-module dependencies — **IoC**: interface in the module, implementation in `app/integrations/` or `app/init/`.
7. Document the module: `README.md` (purpose, public API, example).

### index.ts template

```ts
export { useFeature } from './composables/useFeature'
export { default as FeatureList } from './components/FeatureList.vue'
export type { Feature, CreateFeatureDto } from './types/feature.types'
```

### IoC pattern

```ts
// modules/Notifications/index.ts — interface + composable with optional dependency
export interface NotificationService {
  notify(message: string): void
}

export function useUsers(notificationService?: NotificationService) {
  const notify = notificationService?.notify ?? console.log
  // ...
}

// app/init/users.ts — injection from app
import { googleAnalyticsNotify } from '../integrations/google'
// pass googleAnalyticsNotify into useUsers at initialization
```

## Workflow: add a page

1. **Preferred:** `modules/<Feature>/pages/<route>.vue` + export routes from the module.
2. **Otherwise:** `src/pages/` with file-based routing (convention, not required):
   - `about.vue` → `/about`
   - `posts/[id].vue` → `/posts/:id`
   - `posts/[userId]_[postId].vue` → multiple params
   - `[...404].vue` → catch-all
   - `(group)/` — segment does not appear in the URL
3. Page is **thin**: import from `@/modules/<Name>`, no business logic.
4. Register in `app/router.ts` (if not auto-routing).
5. Route names — `common/constants/routes.ts`.

## Where to put an entity

| Entity | Layer |
|--------|-------|
| Entry point, router, layouts, integrations | **app** (layouts may also be a module) |
| URL page with no domain (404, about) | **pages** |
| URL + domain logic | **modules/.../pages/** |
| Business feature, API, domain store | **modules** |
| Design system / UI library | **modules** (+ IoC if needed in common) |
| Single button, formatDate, one composable | **common** |
| vue-router.d.ts extension, polyfill | **global** |

Full decision tree — [reference.md](reference.md).

## Pages: file-based routing (convention)

| URL | File |
|-----|------|
| `/` | `pages/index.vue` |
| `/about` | `pages/about.vue` |
| `/products/` | `pages/products/index.vue` |
| `/posts/123` | `pages/posts/[id].vue` |
| `/posts/1_2` | `pages/posts/[userId]_[postId].vue` |
| `/docs/a/b/c` | `pages/docs/[...path].vue` |
| named views | `pages/login.form.vue`, `pages/login.content.vue` |

File-based routing is **not required** — a manual router in app is fine.

## Modifications

| Variant | When |
|---------|------|
| **Base** (default) | Medium/large projects |
| **Commonless** | Small projects; everything in modules, no common |
| **Common Module** | common as a single module with index.ts |
| **Multiapp** | `apps/` instead of `app/` — multiple applications |

## Anti-patterns

- ❌ Importing module internals (`@/modules/User/api/userApi`) — only `@/modules/User`
- ❌ `common/index.ts` or a barrel in common (when `allowIndex: false`)
- ❌ Business logic in pages or app
- ❌ A module “for one utility” — use common or a submodule
- ❌ Pseudo-modules `utils`, `types`, `constants` (commonless) — group by meaning
- ❌ >3 levels of submodule nesting without justification
- ❌ Direct imports between modules instead of IoC when coupling is strong
- ❌ Design system / UI library in common — separate module
- ❌ Confusing FEOD common with FSD shared (abstraction layer)

## ESLint / Oxlint plugins

For installation, configuration, usage, lint violations or plugin bugs, read
[lint-plugins.md](lint-plugins.md). First check the installed version and exports;
published npm packages and this repository's source may offer different APIs.

Use the project's existing linter and framework parsers. Keep namespace
`feod-structure/*` with packages `@o-feod/eslint-structure-plugin` and
`@o-feod/oxlint-structure-plugin`. Distinguish an application import violation,
a configuration/resolution problem and a defect in a shared rule before editing.
Fix architectural violations through public APIs or appropriate placement;
repair plugin defects in the shared ESLint implementation and validate Oxlint too.

## Checklist before finishing

- [ ] Imports follow the layer matrix
- [ ] Modules export only through `index.ts`
- [ ] Pages are thin; logic lives in modules (module pages preferred for domain)
- [ ] Common has no index/barrel (by default); entities usually one file
- [ ] Global only for shim/polyfill/global types
- [ ] App has no business logic
- [ ] Project profile and supported lint configuration agree
- [ ] Requested ESLint/Oxlint integration covers the intended source files
- [ ] Relevant lint checks pass; rule fixes have a regression reproducer

## References in this repository

- Docs: `docs/base/`, `docs/structure/`, `docs/tools/`
- SPA example: `examples/vue/spa/src/`
- Todo example: `docs/base/_project-exmaple/full-example/`
- AI rules YAML: `docs/tools/_ai-rule-generator/frontend.md`
- ESLint plugin: `packages/eslint/`, docs: `docs/tools/eslint-plugin.md`
- Oxlint adapter: `packages/oxlint/`, docs: `docs/tools/oxlint-plugin.md`

## Init: lock project variations

If you need to choose a modification (base / commonless / common-module / multiapp), layer names, pages/common policy, and **rewrite the skill for a locked profile** — follow [feod-init.md](feod-init.md). Do not guess variations: questionnaire and confirmation first.

## Additional

- Import matrix, transit modules, migration, SSR/DDD — [reference.md](reference.md)
- File templates and scaffold — [examples.md](examples.md)
- Init / lock profile — [feod-init.md](feod-init.md)
