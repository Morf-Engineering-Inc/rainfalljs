# Changelog

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
