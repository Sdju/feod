---
name: feod
description: >-
  Structures projects with FEOD (Fractal Entity Oriented Design): layers
  app/pages/modules/common/global, import rules, modules with a public API.
  Use when creating or reorganizing project structure, adding modules or pages,
  deciding where code belongs, reviewing imports, or setting up and fixing
  FEOD ESLint/Oxlint plugins. Reads the project profile (feod.profile.md).
---

# FEOD

`$SKILL_DIR` is the absolute path of this skill (the directory with `SKILL.md`, `references/` and
`scripts/`). Set it from the loaded path before shell commands; it is not created automatically.

Center of FEOD is the **module**. Layers are tools for modularity, not abstraction layers.
Pillars: **modularity** and **fractality** (submodules in `modules/<Name>/modules/`).
FEOD ≠ FSD: `common` is a staging area for entities that are not yet a module;
entities routinely move between layers as the project grows.

## Step 0 — project profile

1. Look for `feod.profile.md` in the project root.
2. Found: it **overrides every default** in this skill. Follow it, do not offer other variants.
3. Not found and the task depends on a variant (structure, layer names, pages/common
   policy): run [init.md](references/init.md). Otherwise use the defaults below (base modification).

To see the project as FEOD sees it (config source, layers, modules, public entries, profile
and drift between them), run `node "$SKILL_DIR/scripts/feod.mjs" info --json` from the project
root instead of scanning the tree by hand. Needs Node ≥ 20.19, no install.

Never edit files of this skill to fit a project; the profile is the only project-specific file.

## Layers and imports (base)

```
common → modules → pages → app
global — never imported (available without import; .d.ts via tsconfig)
```

| Layer | Purpose | Imports | Imported by |
|-------|---------|---------|-------------|
| **global** | shims, polyfills, `.d.ts` | — | nobody |
| **common** | small reusable entities, usually 1 file | common | modules, pages, app |
| **modules** | business logic, isolated modules | common, modules (public API only) | modules, pages, app |
| **pages** | URL → component, thin | common, modules | app |
| **app** | bootstrap, router, layouts, integrations | everything below | nobody |

## Hard rules

- `index.ts` is **only** the module public API. No barrels in `common` by default.
- Cross-module imports: only `@/modules/<Name>` → `index.ts`. No zigzag between modules.
- Cross-level imports use the alias (`@/`); in-level / in-module imports are relative.
- `common` → modules only via **IoC** (interface + injection from app).
- Pages are thin; no business logic in pages or app.
- A module is not created "for one utility": use common or a submodule.

Full matrix, path rules, nested levels, modifications and anti-patterns — [rules.md](references/rules.md).

## Where to go for a task

| Task | Read |
|------|------|
| Where does this entity belong? Create/reorganize structure, migrate | [structure.md](references/structure.md) |
| Add a module or page, finish-up checklist, new project | [workflows.md](references/workflows.md) |
| Exact import legality, modifications (commonless / multiapp / …), anti-patterns | [rules.md](references/rules.md) |
| Install/configure plugins, lint errors, plugin bugs | [lint.md](references/lint.md) |
| Lock a project variant, generate the profile | [init.md](references/init.md) |
| Code samples for a framework | [templates/](references/templates/) (`vue-spa.md`) |

## Before finishing

- Imports follow the matrix (and the profile).
- Modules export only through `index.ts`; pages and app hold no business logic.
- If lint is configured, relevant checks pass — see the checklist in [workflows.md](references/workflows.md).

## In this repository

Docs: `docs/base/`, `docs/structure/`, `docs/linting/`. Examples: `examples/`.
Plugins: `packages/eslint/`, `packages/oxlint/`.
