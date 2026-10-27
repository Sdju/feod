# Template for `feod.profile.md` (project root)

Copy the block below, fill the values, delete the "Default" column. Keep it under ~40 lines.
Anything not listed uses the default.

```markdown
---
feod-profile: 1
---

# FEOD profile

> Overrides the defaults of the feod skill. To change it, run the skill's init flow again.

| Parameter | Value |
|-----------|-------|
| modification | base |
| multiapp | no |
| framework | vue (spa) |
| srcRoot / alias | src / @ |
| layers | app, pages, modules, common, globals |
| pages | keep |
| modulePages | yes |
| fileBasedRouting | yes |
| privatePageModules (`pages/_name/`) | allow |
| common.allowIndex | false |
| modules.allowDeepImports | false |
| singleFileModules | no |
| transitModules | none |
| uiKit | separate module |
| layouts | app only |
| ioc | required for cross-module links |
| ddd | no |
| lint | eslint (wired: later) |

## Project notes
<!-- project-specific conventions that do not belong to FEOD itself -->
```

## Defaults

| Parameter | Default |
|-----------|---------|
| modification / multiapp | base / no |
| srcRoot / alias | `src` / `@` |
| layers | app, pages, modules, common, globals |
| pages | keep |
| modulePages | yes |
| fileBasedRouting | yes (no for Angular or a manual router) |
| privatePageModules | allow |
| common.allowIndex | false |
| modules.allowDeepImports | false (do not suggest `true` without a reason) |
| singleFileModules | no |
| transitModules | none |
| uiKit | separate module (commonless: `modules/ui`) |
| layouts | app only |
| ioc | required for cross-module links |
| ddd | no |
| lint | existing linter, wiring later |

## Config mapping

Schema-supported (go to `package.json#feod` / `feod.config.json`): `srcRoot`, `aliasPrefix`,
`layerDirs`, `modulePages`, `singleFileModules`, `transitModules`, `common.maxDepth`, …
(full list: [lint.md](lint.md)).
Profile-only: `allowIndex`, `allowDeepImports`, `publicEntry`, `fileBasedRouting`,
`privatePageModules`, `uiKit`, `layouts`, `ioc`, `ddd`.
