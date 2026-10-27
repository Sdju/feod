# FEOD — workflows

## Add a module

1. Create `src/modules/<PascalCase>/`; internals follow the domain.
2. Export **only what is needed** from `index.ts`; internal files are never imported from outside.
3. Growth: `modules/<Name>/modules/<Sub>/`; not deeper than ~3 levels without reason.
4. Needed by one page only: prefer `modules/<Name>/pages/`; `pages/_<page>/` sparingly.
5. Cross-module dependency: IoC — interface in the module, implementation in `app/integrations/`, wiring in `app/init/`.
6. Document the module: `README.md` (purpose, public API, example), optionally owners.
7. Unit tests live inside the module; multi-module integration tests in `app` (or the parent module).

```ts
// index.ts template
export { useFeature } from './composables/useFeature'
export { default as FeatureList } from './components/FeatureList.vue'
export type { Feature, CreateFeatureDto } from './types/feature.types'
```

## Add a page

1. Preferred: `modules/<Feature>/pages/<route>.vue` + export routes from the module entry.
2. Otherwise `src/pages/` (file-based convention: [structure.md](structure.md)).
3. A page is **thin**: composes things from `@/modules/<Name>`; no business logic. It is
   not merely a re-export of one module component (see the BAD example in the template).
4. Register in `app/router.ts` unless routing is automatic.
5. Route names live in `common/constants/routes.ts`.

## New project

```
- [ ] 1. Run init.md (or accept base defaults) → feod.profile.md
- [ ] 2. Create src/ layers per the profile
- [ ] 3. Alias @ → src in bundler and tsconfig paths
- [ ] 4. app/entry.ts, app/router.ts
- [ ] 5. Wire the ESLint/Oxlint plugin (lint.md); feod config only if the installed version reads it
- [ ] 6. Split features into modules; pages stay thin; shared bits go to common
```

Vite alias: `resolve.alias['@'] = fileURLToPath(new URL('./src', import.meta.url))`.

## Checklist before finishing

- [ ] Imports follow the layer matrix and the profile
- [ ] Modules export only through `index.ts`
- [ ] Pages are thin; logic lives in modules
- [ ] Common has no barrel (unless the profile allows it); entities are usually one file
- [ ] Global only for shim/polyfill/global types
- [ ] App has no business logic
- [ ] Profile and supported lint configuration agree
- [ ] Requested ESLint/Oxlint integration covers the intended source files
- [ ] Relevant lint checks pass; rule fixes have a regression reproducer
