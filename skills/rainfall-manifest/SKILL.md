---
name: rainfall-manifest
description: Use a rainfall.json data-layer manifest to work on a web app's data flow (entities, APIs, components) without re-reading the codebase. Use when the project has a rainfall.json, when the user asks about data flow, API/component wiring, or token-efficient context, or when adding features that touch the data layer.
---

# Rainfall Manifest — token-efficient data-layer context

Rainfall models an app's data like the water cycle:

| Water cycle | App | Manifest key |
|---|---|---|
| Ocean | Database / source of truth | `entities` |
| Evaporation | APIs lifting data out | `endpoints` |
| Clouds | This manifest — condensed knowledge | `rainfall.json` |
| Rainfall | Data landing in UI components | `components` |
| The cycle | End-to-end user flows | `flows` |

The point: **read the manifest instead of the codebase.** A condensed manifest is a few hundred tokens; discovering the same facts by opening files costs tens of thousands. Every id in it is stable, so you and the human can refer to `API-002` or `form.meal.log` instead of pasting code.

## When you start work in a repo

1. Check for `rainfall.json` at the project root.
2. If present, run `npx rainfall condense` (or read the file) **before** exploring source files. Treat its map of entities → endpoints → components as your index; only open the specific files it points you to.
3. If absent and the task touches the data layer, offer to bootstrap one (below).

## Bootstrapping a manifest from scratch

The scan finds the skeleton mechanically; you add the understanding. This is a one-time investment that every later session profits from.

1. **Seed:** `npx rainfall init && npx rainfall scan`. Prune scan results that aren't real screen components or endpoints (helpers, tests, config).
2. **Entities:** read the data models (DB schemas, ORM models, types for stored records) and add each as an entity — stable id (`E001`…), `name`, `source` (e.g. `dynamodb:AppTable`), and a typed `fields` map with `required` flags.
3. **Endpoints:** open each handler and correct what the scan guessed: the real `method` (scan defaults to GET), `reads` (entities/fields queried), `writes` (entities mutated), and `returns` (response shape).
4. **UI ids:** give every component a `uiId` per the convention below; reuse existing `testID` values where present.
5. **Flows:** add 3–8 flows for the main user journeys as ordered typed steps (`ui:` → `api:` → `entity:` → …).
6. **Verify:** `npx rainfall validate` must pass with no errors; then run `npx rainfall report` and show the user their tokens-saved numbers — that's the payoff made visible.

If the code and your manifest draft disagree, the code is right.

## How to use it while working

- **Locating code:** every component and endpoint entry carries a `file` path. Go straight there; don't grep.
- **Impact analysis:** before changing an entity or endpoint, follow its references (`reads`/`writes`, `components`, `flows`) to see everything downstream — that's your change checklist.
- **Referring to things:** use the stable ids (`C001`, `API-002`, `card.home.score`) in your replies, commit messages, and questions to the user. Short ids beat pasted snippets.
- **UI ids:** components use hierarchical `uiId`s (`<element>.<screen>.<purpose>[.variant]`, e.g. `button.login.main`). Reuse them as `testID` in tests and as analytics event ids — one id, three uses.

## Keeping the cycle flowing (your responsibility)

The manifest is only valuable while it's true. **Whenever you add or change an entity, endpoint, or data-consuming component, update `rainfall.json` in the same change**, then run:

```
npx rainfall validate
```

Fix any errors (missing ids, duplicates) and act on warnings (dangling references mean the manifest and code have drifted). Assign new ids by continuing the existing sequence; never renumber existing ids — their stability is the whole point.

## Token budget rules of thumb

- Prefer `rainfall condense` output over the raw JSON when assembling context (it's ~3–5× smaller).
- If the user asks "how does X flow through the app", answer from `flows` first; only open code if the manifest lacks the answer — and then add the missing flow entry so next time it doesn't.
- When summarizing your work for the user, reference manifest ids so the summary stays short and unambiguous.
