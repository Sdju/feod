# @o-feod/config

FEOD project configuration shared by the ESLint and Oxlint plugins and by tooling (for example the FEOD agent skill).

- `loadFeodConfig({ rootDir })` reads `package.json#feod` or `feod.config.json` (exactly one source), validates it against the schema and returns normalized roots.
- `normalizeFeodConfig(config, source)` does the same for an inline object.
- `feodSchema` is the JSON Schema of the configuration.
- `frontendLayers`, `backendLayers`, `libraryLayers`, `cliLayers` are the built-in layer sets.
- Policy types (`ModulePolicy`, `CyclesPolicy`, …) are re-exported by the plugins.

It has no dependency on ESLint, Oxlint or any rule implementation.
