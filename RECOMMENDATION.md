# RainfallJS Review & New Direction: an AI token-optimization tool

This document reviews what exists in this repo, assesses what has value, and explains
the pivot implemented in this PR.

## What's in the repo today

> **Historical note (0.3.0, 2026-09-15).** The React library described in point 1 was
> removed. This document records the reasoning that led to the manifest, and is kept
> as written; it is not a description of the current package. See CHANGELOG.md.

1. **The library** (`src/`, ~570 lines): a React Context wrapper (`DataProvider`,
   `useData`, `withData`) plus prop-mapping helpers for MUI/AntD/Radix/shadcn, and
   Next.js helpers (`NextDataProvider`, `withServerSideData`, `createApiRoute`).
2. **The vision docs** (`importantupdate.md`, `registry.md`, `ui_id_mapper_system.md`):
   RainfallDB (a visual full-stack generator), a numbered API/component registry with
   requirements traceability, and a hierarchical UI ID labeling system
   (`button.login.main`).

## Honest assessment

**The library itself is a hard sell in 2026.** React Query, SWR, and React Server
Components already own the "fetching + loading/error states" space, and the
component-library prop mappers chase moving upstream APIs. Competing there head-on
isn't where the value is.

**The ideas in the docs are the value.** Three of them, combined, are genuinely good
and — importantly — match the new direction (helping AI use tokens efficiently):

1. **The contract** ("the ocean"): one machine-readable file that is the single source
   of truth for the data layer — entities, endpoints, components, and how they connect.
2. **Stable hierarchical IDs**: `card.home.score`, `API-002`. Short, permanent names
   for things, usable by analytics, tests, and conversation alike.
3. **The water-cycle mental model**: data has a *cycle* (source → API → UI → telemetry
   → back to source), and the whole cycle should be visible in one place.

## Why this is a token optimizer

When an AI coding agent works on a web app, most of its context budget goes to
*re-discovering structure*: opening files to learn which component calls which API and
what shape comes back. On a mid-size app that's tens of thousands of tokens per
session, re-spent every session.

A rainfall manifest replaces that discovery with a lookup:

| Without manifest | With manifest |
|---|---|
| Agent greps + reads 15–50 files to map a feature's data flow | Agent reads one condensed digest (a few hundred tokens) |
| "The card on the home screen that shows the score" | `C001` / `card.home.score` |
| Impact analysis = read everything that might reference it | Follow `reads`/`writes`/`components` references |
| Knowledge evaporates when the session ends | Knowledge persists in `rainfall.json`, in git |

The water cycle now describes the *AI knowledge loop*: the codebase is the **ocean**,
scanning **evaporates** structure out of it, the manifest is the **cloud** (condensed,
lightweight, travels anywhere), and it **rains** precise context onto each AI session.
Agents that change the code update the manifest, completing the cycle.

## What this PR adds

- **`skills/rainfall-manifest/SKILL.md`** — the "AI download": an agent skill
  (Claude Code format, readable by any agent) that teaches an AI to read, use, and
  maintain the manifest instead of re-reading the codebase.
- **`schema/rainfall.schema.json`** — JSON Schema for the manifest format.
- **`bin/rainfall.js` + `cli/`** — zero-dependency CLI:
  - `rainfall init` — create a starter manifest
  - `rainfall scan` — heuristically seed it from an existing React/Next.js codebase
  - `rainfall validate` — structure + referential-integrity checks
  - `rainfall condense` — emit the compact AI context digest with a token estimate
- **`examples/manifest/rainfall.json`** — a worked example.
- Tests for the manifest utilities.

The existing React library is left intact — it still works and the manifest doesn't
depend on it — but the recommendation is to make the manifest + skill the headline of
the project and let the library become one of several consumers of the manifest.

## Suggested next steps (not in this PR)

1. Publish the CLI so `npx rainfalljs` works as a true "download".
2. Add `rainfall sync` — detect drift between manifest and code, the way the scan
   detects new code.
3. Optional MCP server exposing `condense`/lookup as tools, so agents query the
   manifest without shelling out.
4. Extend entries with `requirements`/`figma` links (the registry.md idea) once the
   core loop proves itself — that's the designer/analyst audience from the original
   RainfallDB vision.
