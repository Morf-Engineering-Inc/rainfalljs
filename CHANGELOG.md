# Changelog

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
- **AI agent skill** (`skills/rainfall-manifest/SKILL.md`): teaches an AI coding
  agent to read the manifest instead of re-reading the codebase, refer to things by
  stable ids (`C001`, `API-002`, `card.home.score`), and keep the manifest updated.
- Example manifest (`examples/manifest/rainfall.json`) and manifest test suite.
- `RECOMMENDATION.md`: project review and rationale for the new direction.

### Unchanged

- The original React/Next.js data-provider library (`DataProvider`, `useData`,
  component mapping, `NextDataProvider`) ships as before.

## 0.1.3 and earlier

React/Next.js data-provider library: context-based `DataProvider`, `useData` hook,
`withData` HOC, component-library prop mapping (MUI, Ant Design, Radix), and
Next.js SSR helpers.
