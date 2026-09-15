# Changelog

## 0.3.2 — 2026-09-15

Documentation only. Publishes what 0.3.1 did not.

0.3.1 was published from main before #41 merged, so the npm tarball carried the
badge fixes and nothing else — while the repo at the same version number carried
three more documentation changes. Same version, two different contents. This bump
exists to make the published README match the repo again.

- **The logo renders.** `assets/logo.png` — the original was named
  `_transparent` and was not: a pale grey was baked in behind the mark, so it
  showed as a grey square in dark mode. Cleared by flood fill from the border
  (a colour match would have punched holes through the near-white circuit
  traces), cropped, and resized: 500 KB to 221 KB. Referenced by absolute URL,
  because npmjs.com does not resolve relative image paths.
- **A FAQ**, replacing the one 0.3.0 dropped. It leads with whether this works
  from a frontend that is not JavaScript — it does, and the answer says how,
  including the honest limit that `scan` reads React/Next source only.
- **The demo is findable.** examples/fintech-demo had landed with 25 files and
  was referenced nowhere in the README.
- **The demo numbers were wrong and are corrected.** TOKENS.md called itself
  reproducible while reporting 19 files / ~4977 tokens / 6.9x; the real figures
  are 17 / ~3699 / 5.1x. Nothing was wrong with the tool — a measurement was
  written down once and never re-run. Guarding this in CI is issue #43.

## 0.3.1 — 2026-09-15

Documentation only. No code change.

- **Badges fixed.** The pre-0.3.0 README carried a "Build Status" badge pointing at
  `github.com/morf_engineering/rainfalljs` — the wrong organisation, so it had been a
  broken image for the life of the package. It is gone, and the four that remain are
  verified to resolve: Tests, npm version, npm downloads, MIT.
- **Added a `dependencies-0` badge.** It is the shortest true thing about this package
  and worth stating on the tin.
- **New FAQ**, replacing the one dropped in 0.3.0. That FAQ was written pre-AI and
  asked React questions — Context API, class components, Redux comparisons — about a
  runtime this package no longer has. The new one leads with the question the old
  framing obscured: whether this works with frontends that are not JavaScript. It
  does, and the answer says how, including the one honest limit (`scan` reads
  React/Next source only; every other stack builds its manifest via `rainfall
  prompt` and an assistant, which is the recommended path on every stack anyway).
- Republished so npmjs.com serves the current README. npm renders the README from the
  published tarball, so a docs change only reaches that page on a publish — which is
  why this is a version bump rather than a commit.

## 0.3.0 — 2026-09-15

**Breaking: the React runtime is removed.** The manifest tool is the package.

### Removed

- `DataProvider`, `useData`, `withData`, `NextDataProvider`, `withServerSideData`,
  `createApiRoute`, and the React/Next peer dependencies and babel build. A Context
  data layer that `@tanstack/react-query` does better. The root entry threw
  `MODULE_NOT_FOUND` on every 0.1.x release, so a working consumer is unlikely; pin
  `0.2.0` if you were one.
- `react-data-provider/` — a tracked `package.json` and 297-entry lockfile with no
  tracked source. Most of the 77 vulnerabilities GitHub reported were its.
- The rollup/microbundle toolchain, referenced by no script.
- `HONEST_VALUE_ASSESSMENT.md` and a 1.2 MB unused image (still in history from #15).

### Added

- **`rainfall components [--json]`** — the component-shape catalogue: what each UI
  component type accepts as data and produces as props. Eleven shapes: Select, Table,
  List, Card, Tabs, Timeline, Chart, Stat, KeyValue, Tree, Form.
- **`schema/components.json`** — that catalogue as data, so a SwiftUI, Flutter,
  Blazor, Django or Rails frontend can read the same contract and implement it
  natively. The JS mappings are a convenience, not the point.
- **`@morf_engineering/rainfalljs/mapper`** — component mapping without React. Pure
  `(data, options) => props`. The 0.2.x mapper called `useData()` internally, so it
  only ran inside a React tree, which is why it was never tested.
- **The Data Map** (`defineDataMap`, `validate`, `brief`) — the typed model, adding
  business requirements and access patterns (key expression + index) to the manifest's
  entities/endpoints/components.

### Fixed

- **The CLI was documented and unshippable.** The README advertised `npx rainfall …`
  while `package.json` had no `bin` field and `files` excluded `bin/` and `cli/`.
- `__tests__/package.test.js` now *executes* the CLI and resolves every path in
  `exports`, `bin` and `main`. The suite it replaces read the bundle as text looking
  for a substring, which is how 0.1.3 shipped three unusable versions green.
- An unregistered mapping throws instead of returning raw data behind a
  `console.warn` — which rendered a blank panel with no error anywhere.
- 0 vulnerabilities; devDependencies 20 → 2; no runtime dependencies.
- `repository.url` normalized, so npm stops auto-correcting it at publish time.

## 0.2.0 — 2026-08-18

RainfallJS pivots toward AI-assisted development: the water cycle now describes how
knowledge about your app's data layer flows into (and back out of) AI coding sessions.

### Added

- **Rainfall manifest** (`rainfall.json`): a compact, machine-readable map of your
  app's data layer — entities (the ocean), endpoints (evaporation), components
  (rainfall), and flows (the full cycle). Spec: `schema/rainfall.schema.json`.
- **`rainfall` CLI** (zero dependencies):
  - `rainfall init` — create a starter manifest
  - `rainfall scan` — heuristically seed the manifest from a React/Next.js codebase
  - `rainfall validate` — structure and referential-integrity checks
  - `rainfall condense` — emit a compact AI context digest with a token estimate
  - `rainfall report` — tokens-saved report comparing the digest against the cost
    of reading the mapped source files (and the whole project); missing mapped
    files are flagged as manifest drift
  - `rainfall prompt` — prints paste-ready AI instructions that walk any coding
    assistant through building and enriching the manifest (seed with scan, add
    entities/reads/writes/flows from the code, verify, keep it updated)
  - `rainfall condense --focus <ref>` — scoped digest for large apps: just one
    item (by id, name, path, or uiId) plus everything it touches — its
    endpoints, their entities, sibling consumers, and related flows
- **AI agent skill** (`skills/rainfall-manifest/SKILL.md`): teaches an AI coding
  agent to read the manifest instead of re-reading the codebase, refer to things by
  stable ids (`C001`, `API-002`, `card.home.score`), and keep the manifest updated.
- Example manifest (`examples/manifest/rainfall.json`) and manifest test suite.
- `RECOMMENDATION.md`: project review and rationale for the new direction.

### Unchanged

- The original React/Next.js data-provider library (`DataProvider`, `useData`,
  component mapping, `NextDataProvider`) ships as before. *(Removed in 0.3.0.)*

## 0.1.3 and earlier

React/Next.js data-provider library: context-based `DataProvider`, `useData` hook,
`withData` HOC, component-library prop mapping (MUI, Ant Design, Radix), and
Next.js SSR helpers.
