# FEOD — rules

Single source for import legality and variants. The project profile
(`feod.profile.md`) selects which deltas below apply.

## Cross-level import matrix (base)

| Imports ↓ / from → | global | common | modules | pages | app |
|--------------------|--------|--------|---------|-------|-----|
| **global** | — | ❌ | ❌ | ❌ | ❌ |
| **common** | ✅* | ✅ | ❌** | ❌ | ❌ |
| **modules** | ✅* | ✅ | ✅ (public API) | ❌ | ❌ |
| **pages** | ✅* | ✅ | ✅ (public API) | ❌ | ❌ |
| **app** | ✅* | ✅ | ✅ (public API) | ✅ | ❌ |

\* global is not imported — wired via tsconfig / entry init  
\*\* common → modules only via IoC (interface in common/module, implementation in app)

npm packages may be imported anywhere.

## Path rules

| Import type | Path |
|-------------|------|
| Cross-level | `@/common/utilities/formatDate` |
| Cross-module | `@/modules/User` (→ index.ts) |
| In-level (pages) | `./_home` (private module) |
| In-module | `./composables/useUsers` |
| Submodule → parent | `../composables/useUsers` (exception, minimize) |

Submodule from outside: public API of the parent only.

## Nested levels

The path defines the logical layer, not folder depth. Special rules only for:

| Path | Logical layer |
|------|---------------|
| `modules/<Name>/modules/<Sub>/` | modules (submodule) |
| `modules/<Name>/pages/` | pages (module pages) |
| `pages/_name/` | modules (private page module) |
| `modules/<group>/<child>/` with `<group>/_/index.ts` | modules (transit submodule) |

Everything else (`common/ui/Button.vue`, ...) belongs to the enclosing layer.
Rule priority: project profile > level rules > base rules.

- **Module pages** — a module may import its own pages to re-export through the public API.
  Preferred over top-level `pages/` for domain URLs.
- **Private page module** (`pages/_name/`) — usable only by the owning page; has no pages
  of its own; does not import other entities at pages level. Use sparingly.
- **Transit module** — container without its own `modules/`; `_/index.ts` is the private
  API for its submodules. Lint option: `transitModules`.

```
modules/package-manager/
  _/index.ts
  npm/
  yarn/
  pnpm/
```

## Modifications (deltas to base)

| ID | Delta |
|----|-------|
| `base` | default; nothing changes |
| `commonless` | no `common/`; everything in `modules/` grouped by meaning (`modules/ui/`, not `utils/`). Only allowed types-only module: utility types (`Flatten<T>`). Prefer submodules over new top-level modules. |
| `common-module` | `modules/common/index.ts` replaces `common/`; minimize its imports of other modules; keep extracting entities into modules as the project grows. |
| `multiapp` | `apps/<name>/` replaces the single `app/`; modules/common/pages shared. Combines with the three above. Each app has the `app` rules. |

Alternative layer names keep the same rules: `boot`≈app, `views`/`routes`≈pages,
`shared`≈common (FEOD semantics, not FSD). Names are set in the profile / `layerDirs`.

## Anti-patterns

- ❌ Importing module internals (`@/modules/User/api/userApi`) — only `@/modules/User`
- ❌ `common/index.ts` or a barrel in common (unless the profile allows it)
- ❌ Business logic in pages or app
- ❌ A module "for one utility" — use common or a submodule
- ❌ Pseudo-modules `utils`, `types`, `constants` — group by meaning
- ❌ More than ~3 levels of submodule nesting without justification
- ❌ Direct module → module imports instead of IoC when coupling is strong
- ❌ Design system / UI library in common — separate module
- ❌ Zigzag imports between modules

## FSD habits to unlearn

| Habit | In FEOD |
|-------|---------|
| common = shared abstraction layer | common = temporary staging area |
| widgets/features/entities | one modules layer |
| barrel in shared/common | `index.ts` only in modules |
| logic in pages | modules + thin pages |
| utils/types/constants modules | common or domain modules |

## IoC pattern

```ts
// modules/User/composables/useUsers.ts — interface + optional dependency
export interface NotificationService { notify(message: string): void }

export function useUsers(notificationService?: NotificationService) {
  const notify = notificationService?.notify ?? console.log
  // ...
}
```

Implementation lives in `app/integrations/`; `app/init/` wires it in.
Complete example — [templates/vue-spa.md](templates/vue-spa.md).
