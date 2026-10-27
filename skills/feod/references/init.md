# FEOD init — generate the project profile

**Goal:** detect → propose → one confirmation → write `feod.profile.md`
(and optionally the lint config). This skill's files are never rewritten.

Do not invent rules outside FEOD docs. Do not ask what can be detected or defaulted.

## 1. Detect

Run `node "$SKILL_DIR/scripts/feod.mjs" info --json` from the project root: it reports config source,
roots, layers, modules and drift. Where it is not enough (framework, linter), inspect manually, in this order,
and fill the profile from reality:

| Field | Source |
|-------|--------|
| framework / meta-framework | `package.json` dependencies (vue, react, next, nuxt, angular, svelte, …) |
| linter | eslint / oxlint config files and scripts |
| srcRoot, alias | `src/`, `tsconfig` paths, bundler alias |
| layer names | existing dirs matching app/boot, pages/views/routes, modules, common/shared, global(s) |
| modification | no `common/` → commonless; `modules/common/index.ts` → common-module; `apps/` → multiapp |
| existing config | `package.json#feod` or `feod.config.json` (never create a second source) |

An existing profile: show it and ask only what the user wants to change.
If the user already named a set ("commonless + multiapp"), take it and skip those questions.

## 2. Ask (only what remains unknown, max 3)

1. **Modification:** `base` (recommended) | `commonless` | `common-module`; **multiapp** yes/no.
2. **Pages policy:** `keep` | `omit` (module pages only) | `minimal` (non-domain pages only).
3. **Linter wiring:** now | later | no (default: use the existing linter, later).

Use AskUserQuestion when available. Everything else takes the default from the
table in [profile.template.md](profile.template.md). Offer "customize" for advanced
fields (layer names, `common.allowIndex`, transit modules, single-file modules, IoC strictness,
layouts policy, DDD); do not ask about them unprompted.

Backend, library and CLI projects: same flow with these layer-name hints —
app→`lib`/`app`, pages→`routes`/`commands`; skip frontend-only fields (framework routing, layouts).

## 3. Confirm

Show the card and wait for OK (skip only if the user said "lock as …" with a complete set):

```text
FEOD profile
  modification: base, multiapp=no
  framework: vue (spa)
  layers: app, pages, modules, common, globals   srcRoot: src   alias: @
  pages: keep, modulePages=yes, fileBased=yes
  policies: allowIndex=false, deepImports=false, singleFileModules=no, transit=none
  write: feod.profile.md + feod config (schema fields only)
```

## 4. Write

1. `feod.profile.md` in the project root, from [profile.template.md](profile.template.md).
2. Lint config (only if chosen): follow [lint.md](lint.md) for the installed version.
   Put **schema-supported** fields into one source — `package.json#feod` or
   `feod.config.json`. Keep `allowIndex`, `allowDeepImports`, `publicEntry`,
   routing and private-page policies in the profile only.
3. Report in a few lines: what was locked, files changed, how to change the profile (run init again).

## 5. Changing the profile

Run this flow again with the existing profile; rewrite the profile and config together.
Never leave two conflicting profiles.
