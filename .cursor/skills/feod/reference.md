# FEOD — reference

## Cross-level import matrix

| Imports ↓ / from → | global | common | modules | pages | app |
|--------------------|--------|--------|---------|-------|-----|
| **global** | — | ❌ | ❌ | ❌ | ❌ |
| **common** | ✅* | ✅ | ❌** | ❌ | ❌ |
| **modules** | ✅* | ✅ | ✅ (public API) | ❌ | ❌ |
| **pages** | ✅* | ✅ | ✅ (public API) | ❌ | ❌ |
| **app** | ✅* | ✅ | ✅ (public API) | ✅ | ❌ |

\* global is not imported — entities are wired via tsconfig / entry init  
\*\* common → modules only via IoC (interface in common/module, implementation in app)

## Path rules

| Import type | Path |
|-------------|------|
| Cross-level | `@/common/utilities/formatDate` |
| Cross-module | `@/modules/User` (→ index.ts) |
| In-level (pages) | `./_home` (private module) |
| In-module | `./composables/useUsers` |
| Submodule → parent | `../composables/useUsers` (exception, minimize) |

## Nested layers (inner levels)

The path defines the “logical layer”, not folder depth:

| Path | Logical layer |
|------|---------------|
| `common/ui/Button.vue` | common |
| `modules/User/pages/profile.vue` | pages (module pages) |
| `modules/User/modules/Avatar/` | modules (submodule) |
| `pages/_home/index.ts` | modules (private page module) |
| `modules/package-manager/npm/` | modules (transit submodule) |

### Module pages

- Live in `modules/<Name>/pages/`
- A module may import its own pages for re-export through the public API
- Preferred over top-level `pages/` for domain URLs

### Private page modules (`pages/_name/`)

- Available only to the owning page
- Do not have their own pages
- Do not import other entities at the pages level
- Use sparingly; prefer module pages

### Transit modules

Structure without an inner `modules/` — a container for submodules:

```
modules/package-manager/
  _/index.ts          # private API for submodules
  npm/
  yarn/
  pnpm/
```

In ESLint: `transitModules: ['package-manager']`

## Decision tree: where to put things

Entities routinely **move** between layers (common → module and back) — that is expected.

```
Need global availability without import?
  → global (only .d.ts, polyfill, shim)

Tied to a business domain?
  → modules
    Need a URL?
      → modules/<Name>/pages/
    Only for one top-level page?
      → pages/_<page>/ (or better: module pages)
    Too large / need isolation?
      → modules/<Name>/modules/<Sub>/ (not deeper than ~3 levels)
    Depends on another module?
      → IoC (interface + app/init)

Universal entity in 1 file, no business logic?
  → common
    Several related files / design system?
      → modules (not common)
    Needs another module?
      → modules or IoC

Bootstrap / config / router / layout?
  → app (layouts may also be a separate module)

URL with no clear domain (404, about)?
  → pages (thin; logic from modules)

Everything maps to module pages?
  → top-level pages/ can be omitted (or keep only 404/about)
```

## Module internal structure (recommended)

FEOD **does not prescribe** internals — only the public API. Typical:

```
ModuleName/
  types/          # *.types.ts
  api/            # *Api.ts
  composables/    # use*.ts
  components/     # or ui/
  store/          # *Store.ts
  pages/          # optional
  modules/        # submodules
  index.ts
```

## Modifications in detail

### Commonless

- No `common/` — everything in `modules/`
- Group by meaning: `modules/ui/`, not `modules/utils/`
- Exception: utility types (`Flatten<T>`) — the only allowed “types-only” module
- Prefer submodules over new top-level modules

### Common Module

- `modules/common/index.ts` — barrel for all of common
- Minimize imports of other modules from the common-module
- Still extract entities into separate modules as the project grows

### Multiapp

```
src/
  apps/
    web/
    admin/
  modules/    # shared
  common/
  pages/      # or pages inside apps
```

## Migrating to FEOD

1. Carve out `app/` — entry, router, config
2. Pages → `pages/` (or `modules/*/pages/`)
3. Features → `modules/<Feature>/` with `index.ts`
4. Shared utilities → `common/`
5. Global types/shim → `globals/`
6. Fix imports to match the matrix
7. Add feod.config + ESLint plugin

## SSR extension

Key: split client/server entry. Variant under `app/`:

```
app/
  entry.client.ts
  server/
    entry.server.ts
```

Or a separate server layer (see `docs/base/extensions.md`). Ready-made SSR frameworks need not follow this layout.

## DDD extension (inside a module)

```
ModuleName/
  domain/
    entities/
  adapters/       # primary: UI; secondary: API/repos
  index.ts
```

## Common mistakes from FSD developers

| Mistake | Correct in FEOD |
|---------|-----------------|
| common = shared abstraction layer | common = temporary staging area |
| widgets/features/entities | one modules layer |
| barrel in shared/common | index.ts only in modules |
| logic in pages | modules + thin pages |
| utils/types/constants modules | common or domain modules |

## Module documentation

Recommended: `README.md` or a comment in a single-file module:
- purpose
- public API
- usage example
- owners (optional)

## Testing

- Module unit tests — inside the module, isolated
- Multi-module integration — in `app` (or in the parent for submodules)

## ESLint / Oxlint

For package/version discovery, installation, presets, options, resolution,
project violation fixes and shared rule development, see [lint-plugins.md](lint-plugins.md).
