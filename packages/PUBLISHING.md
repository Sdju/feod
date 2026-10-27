# Publishing @o-feod packages

The three packages (`@o-feod/config`, the ESLint and the Oxlint plugin) use `.github/workflows/publish-npm-packages.yml` in `Sdju/feod`.
The workflow runs on GitHub-hosted runners with Node 24, npm 11 and OIDC
(`id-token: write`). It does not use an npm token secret.

## One-time setup

Each package must exist on npm before its trusted publisher can be configured.
New packages therefore require an initial authenticated publish. Configure
the following trusted publisher for **each** package on npmjs.com afterwards:

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `Sdju` |
| Repository | `feod` |
| Workflow filename | `publish-npm-packages.yml` |
| Environment | Leave empty |
| Allowed actions | Allow direct `npm publish` |

The trust relationships are configured for the ESLint and Oxlint packages; `@o-feod/config` is new and needs its initial authenticated publish and trust setup first (the plugins depend on it, so it must be published before them). To recreate them
with npm 11.15+ after an initial authenticated publication:

```sh
npm trust github @o-feod/config --repo Sdju/feod --file publish-npm-packages.yml --allow-publish --yes
npm trust github @o-feod/eslint-structure-plugin --repo Sdju/feod --file publish-npm-packages.yml --allow-publish --yes
npm trust github @o-feod/oxlint-structure-plugin --repo Sdju/feod --file publish-npm-packages.yml --allow-publish --yes
npm trust list @o-feod/config
npm trust list @o-feod/eslint-structure-plugin
npm trust list @o-feod/oxlint-structure-plugin
```

Scope ownership or package write access for `@o-feod` and account 2FA are required.
The initial `0.1.0-bootstrap.0` versions use the `bootstrap` tag; stable releases
use `latest` and are published by the trusted workflow. npm may take a few
minutes to process newly published packages before they can be installed.

The repository is currently private. OIDC publishing works for private
repositories, but npm provenance is only generated from public repositories.
The workflow selects provenance automatically from the repository visibility.

## Releases

1. Update package versions and commit the release to `main`.
2. Open **Actions → Publish npm packages (trusted publishing) → Run workflow**.
3. Select `both`, `config`, `eslint` or `oxlint`. Start with `dry_run: true` to validate
   the archives, then run with `dry_run: false` to publish.

`both` publishes config, then ESLint, then Oxlint. Already published versions are skipped
so the workflow can resume after a partial release. An existing version cannot
be replaced; increment its version to publish updated contents.

The pipeline builds and tests both packages, then publishes archives produced
by `pnpm pack`. Packing converts the `workspace:^` dependencies between packages into an npm
version range. A dry run checks archive contents, but does not verify the OIDC
trust relationship; only a real publish does that.

Local archive validation (after building both packages):

```sh
node scripts/publish-npm.mjs
```

See [npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/).
