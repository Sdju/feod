# FEOD Init — lock project variations into the skill

If you read this message, you need to adopt the FEOD methodology to the project.

**Goal:** ask for variations → confirm → rewrite the skill so chosen rules are **hard** (no “by default / optional / other modification” branching), plus sync `feod` in `package.json` (or `feod.config.json`).

**Knowledge base:** [SKILL.md](SKILL.md), [reference.md](reference.md), [examples.md](examples.md). Do not invent rules outside FEOD docs.

---

## 1. Before asking questions

1. Inspect existing `package.json` → `feod`, `feod.config.json`, and `src/` structure — propose values from reality, not from scratch.
2. There are in context information about the project specific?
3. Ask questions in **batches** (3–5 at a time), not a wall. If the user already named a set (“commonless + vue + multiapp”) — fill gaps only, do not re-ask everything.
4. If you see that some questions are not relevant to the project, skip them.
5. When give optional points, don't ask user directly choose, use recommended by default.

Use AskQuestion when available; otherwise a numbered list with options in chat.

---

## 2. Variations questionnaire

### A. Project specific

1. Frontend project:
1.1 without meta-framework(Next.js, Nuxt.js, etc.): skip this paragraph.
1.2 with meta-framework check existance in './init-data/<meta-framework-name>.md' if not exist, read './init-data/meta-framework-general.md' read this first.
2. Backend project: read './init-data/backend.md' read this first.
3. Library project: read './init-data/library.md' read this first.
4. CLI app: read './init-data/cli-app.md' read this first.

### A. Structure modification (required, one)

| ID | Variant | Essence |
|----|---------|---------|
| `base` | Base (recommended) | `common/` + `modules/` + `pages/` + `app/` +  `globals/` |
| `commonless` | Commonless | no `common/`; everything in `modules/`; no pseudo-modules `utils`/`types`/`constants` |
| `common-module` | Common Module | instead of `common/` — `modules/common/` with `index.ts` |
| `multiapp` | Multiapp | `apps/<name>/` instead of a single `app/`; modules/common shared |

`multiapp` combines with `base` / `commonless` / `common-module`. Ask separately: multiapp yes/no.

### C. Layer names (`layerDirs`)

Ask custom or default:

| Role | Default | Alternatives |
|------|---------|--------------|
| app | `app` | `boot`, for multiapp — `apps`, library project — `lib` |
| pages | `pages` | `views`, `routes`, cli - `commands`, backend - `routes` |
| modules | `modules` | (rare) |
| common | `common` | `shared` (FEOD semantics, not FSD) |
| global | `globals` | `global` |

Also: `srcRoot` (usually `src`), `aliasPrefix` (usually `@`).

### D. Pages

- Top-level `pages/`: `keep` | `omit` (module pages only + rare 404/about) | `minimal` (non-domain only)
- Module pages (`modules/<Name>/pages/`): `yes` (recommended) | `no`
- File-based routing convention: `yes` | `no` (manual router)
- Private page modules (`pages/_name/`): `allow` | `forbid`

### E. Common / modules policy

- `common.allowIndex`: `false` (recommended) | `true`
- `modules.allowDeepImports`: `false` (recommended) | `true` (do not suggest without a reason)
- Single-file modules (`modules/foo.ts`): `yes` | `no`
- Transit modules: name list or `none`
- UI kit: separate module | primitives in common (for commonless — module only / `modules/ui`)

### F. App and extensions

- Layouts: `app` only | module `layouts` allowed
- IoC: required for cross-module links | soft
- DDD inside a module (`domain/`, `adapters/`): `yes` | `no`
- Linter integration: existing ESLint / Oxlint / both; wire now | later | no

### G. Where to lock (required)

| Target | Action |
|--------|--------|
| `rewrite-skill` | Rewrite `SKILL.md` (+ tweak reference if needed) for the locked profile |
| `skill-plus-config` | Same + `feod` section in package.json / feod.config.json |
| `config-only` | Only feod.config, leave skill alone (rare) |

Default for init: `skill-plus-config`.

---

## 3. Confirmation

Show a short card and wait for OK:

```text
FEOD lock
  modification: base + multiapp=no
  framework: vue / spa
  layers: app, pages, modules, common, globals
  pages: keep + modulePages=yes + fileBased=yes
  common.allowIndex: false
  deepImports: false
  singleFileModules: no
  transit: none
  write: skill-plus-config → .cursor/skills/feod/
```

Do not rewrite files without confirmation (except when the user immediately said “lock as …” with a full set).

---

## 4. Rewrite the skill (lock)

### Locked skill principles

1. At the top of `SKILL.md` — a **“Project profile (locked)”** block with chosen IDs and paths. The agent **must** follow only that.
2. Remove or mark N/A unselected modifications (do not leave “or commonless”).
3. Import tables, `src/` tree, workflows, “where to put”, anti-patterns, checklist — only for the chosen profile.
4. Keep FEOD essence (modules, public API, fractality, IoC) — do not contradict docs.
5. Frontmatter description: add project triggers and a phrase like “rules locked via feod-init”.
6. `reference.md` / `examples.md`: trim to the profile or add a “Locked overrides” section in reference; do not bloat SKILL.md (>500 lines — move to reference).
7. If multiapp / commonless / common-module — rewrite the import matrix and structure explicitly.

### Locked SKILL.md header template

```markdown
---
name: feod
description: >-
  FEOD for this project (locked profile). … Use when …
---

# FEOD — project rules

> **Locked.** Profile set via feod-init. Do not suggest other modifications
> without an explicit request to change the profile (then run feod-init.md again).

## Project profile (locked)

| Parameter | Value |
|-----------|-------|
| modification | base |
| multiapp | no |
| framework | vue / spa |
| srcRoot | src |
| alias | @ |
| layerDirs | app, pages, modules, common, globals |
| … | … |

## Layers and imports
…only the chosen matrix…

## Structure
…only the chosen tree…
```

### Sync feod.config

If `skill-plus-config`, follow [lint-plugins.md](lint-plugins.md) for the installed
version's supported configuration. Store only schema-supported fields in
`package.json#feod` or `feod.config.json`; keep `allowIndex`, `allowDeepImports`,
`publicEntry`, routing conventions and private-page policy in the locked skill.
These are not fields in the current lint schema. For npm `0.1.0`, wire equivalent
supported per-rule options explicitly: static presets do not read project JSON.
Do not write both configuration sources. Retain the lint reference when locking the skill.

### After writing

Briefly: what was locked, which files changed, how to change the profile (`feod-init` again).

---

## 5. Changing the profile

If the user wants different variations: run this workflow again → rewrite the locked block and config. Do not leave conflicting rule layers “just in case”.


## Workflow: new project

```
- [ ] 1. Choose modification (base / commonless / common-module / multiapp)
- [ ] 2. Create src/ with layers (global optional; pages optional when using module pages)
- [ ] 3. Add feod section to package.json (see reference.md)
- [ ] 4. Configure alias @ → src in bundler + tsconfig paths
- [ ] 5. app/entry.ts — entry point; app/router.ts — routes
- [ ] 6. Wire the chosen @o-feod ESLint/Oxlint plugin using lint-plugins.md
- [ ] 7. Split features into modules; pages stay thin; shared bits go to common
```

---

## Agent checklist

- [ ] Skill target path clarified
- [ ] A–G collected (or explicit partial from the user)
- [ ] Card shown, OK received
- [ ] SKILL.md rewritten with locked profile
- [ ] reference/examples aligned if needed
- [ ] feod.config / package.json `feod` updated (if chosen)
- [ ] User got a short summary
