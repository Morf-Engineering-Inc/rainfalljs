# Contributing

Thanks for looking. This is a small package with a narrow job: keep one map of an
app's data layer, and fail the build when it stops being true.

## Getting set up

```bash
git clone https://github.com/Morf-Engineering-Inc/rainfalljs
cd rainfalljs
npm ci
npm test
```

Node ≥ 18. Two devDependencies (`jest`, `typescript`) and no runtime dependencies —
please keep it that way. A dependency here is a dependency in everyone's CI.

```bash
npm run typecheck   # tsc --noEmit over src/
npm run build       # tsc, then regenerate schema/components.json
npm test            # build, then jest
```

## Layout

| Path | What |
|---|---|
| `bin/rainfall.js`, `cli/` | the CLI — plain CommonJS, no build step |
| `src/datamap/` | the typed model: define, validate, report |
| `src/mapper/` | component mapping — pure `(data, options) => props` |
| `schema/rainfall.schema.json` | the manifest format |
| `schema/components.json` | **generated** from `src/mapper` — do not hand-edit |
| `skills/rainfall-manifest/` | the agent skill |

`schema/components.json` is produced by `scripts/gen-components.mjs` during `npm run
build`. A test asserts it matches the TypeScript catalogue, so editing it by hand fails
the suite. Change `CATALOGUE` in `src/mapper/index.ts` and rebuild.

## Tests

**A test must exercise the thing, not describe it.** This is not a style preference
here; it is the specific way this package has failed before.

Version 0.1.3 shipped a root entry that required a file the build never emitted. The
package could not be imported at all, across three published versions, and the suite
was green the whole time — because it read `dist/index.js` as *text* and asserted the
string `"DataProvider"` appeared in it.

`__tests__/package.test.js` now resolves every path in `exports`, `bin` and `main`, and
executes the CLI. If you add an entry point, add it there.

The same rule applies to new features: prefer a test that calls the function over one
that checks a file exists.

## Pull requests

- Branch from `main`. CI runs `npm ci`, `npm run typecheck`, `npm test`.
- Commit messages: [Conventional Commits](https://www.conventionalcommits.org) —
  `feat:`, `fix:`, `docs:`, `chore:`, `test:`, with `!` for a breaking change. Release
  notes are grouped from PR labels, and the prefix is what suggests the label.
- Say what was wrong, not only what changed. A commit that explains the failure is
  worth more later than one that lists the edit.

## Releasing

`CHANGELOG.md` is written by hand — it carries reasoning that generated notes cannot.
GitHub's release notes are generated from merged PRs (`.github/release.yml`) and
complement it rather than replacing it.

1. Bump `version` in `package.json` and add a `CHANGELOG.md` entry.
2. Merge to `main`, green.
3. Create a GitHub release tagged `vX.Y.Z`. Use **Generate release notes**, then paste
   the changelog entry above them.
4. `.github/workflows/publish.yml` fires on release creation and publishes to npm using
   **Trusted Publishing** (OIDC) — no token and no 2FA prompt, provided this repo and
   workflow are configured as a trusted publisher on npmjs.com. It falls back to an
   `NPM_TOKEN` secret if one is set.

Never `npm publish` from a laptop for a real release: the workflow is the only path
that runs `npm ci` and the full suite against a clean tree first.

## Scope

Additions should serve the one job. Things that do not: a data-fetching runtime (that
was removed in 0.3.0 — `@tanstack/react-query` does it better), framework bindings, and
mappings named after a UI library rather than a shape.

If you are unsure whether something fits, open an issue before building it.
