# RainfallJS

[![Tests](https://github.com/Morf-Engineering-Inc/rainfalljs/actions/workflows/test.yml/badge.svg)](https://github.com/Morf-Engineering-Inc/rainfalljs/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@morf_engineering/rainfalljs.svg)](https://www.npmjs.com/package/@morf_engineering/rainfalljs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**One map of your data layer — front end, middle, back end — that your build keeps
honest.**

Entities, endpoints, the component hierarchy that renders them, the screens they land
on, and the business requirements they serve. One file. Checked in CI.

It is the linchpin that keeps the front end and the back end locked together while both
change: rename a field and the map says which components break; add a screen and it says
which endpoint nothing serves. And because it is small and typed, an AI agent reads the
whole data layer in a few hundred tokens instead of rediscovering it file by file, every
session.

```
      ocean        your database and code — the source of truth
        ↓ evaporation      rainfall scan lifts the structure out
      cloud        rainfall.json — entities → endpoints → components → screens
        ↓ rainfall         rainfall condense rains precise context into a session
      ground       the agent changes code, and updates the map as it goes
        ↺ the cycle        validate fails the build if the two ever part
```

Nothing evaporates. That is the whole trick.

---

## The problem

Ask an agent to change one endpoint and it reads dozens of files to rediscover which
component calls what. Every session. Tens of thousands of tokens, most of it
rediscovering what was already true yesterday.

The obvious fix is an architecture document. The reason that has never worked is that
nothing checks it, so it is wrong within a month and then actively misleads.

## The fix

One manifest, and a build step that fails when it stops matching the code.

```
rainfall.json          entities → endpoints → components → screens → requirements
rainfall validate      referential integrity: a dangling reference is an error
rainfall condense      the whole data layer, a few hundred tokens, for a prompt
```

Small is easy. **Small and verified** is the part that has not existed before.

On a real codebase — a genealogy research app with a 43-noun vocabulary and a
52-surface register — **113 KB of documents and registers condensed to 14 KB.** Roughly
28,000 tokens down to 3,500. And it is current, because `validate` runs in CI.

It also found three things the prose had missed, including a core domain entity with a
route, an API client and a Lambda, and **no row in the surface register**.

---

## Install

```bash
npx @morf_engineering/rainfalljs init     # no install needed
npx @morf_engineering/rainfalljs scan     # seed it from your code
```

```bash
npm install -D @morf_engineering/rainfalljs
npx rainfall validate
```

**No runtime dependencies.** Node ≥ 18.

## Commands

| Command | Does |
|---|---|
| `rainfall init [name]` | create a starter `rainfall.json` |
| `rainfall scan [dir]` | seed the manifest from a React/Next.js project |
| `rainfall validate [file]` | structure and referential integrity — **run this in CI** |
| `rainfall condense [file] [--focus <ref>]` | the compact digest; `--focus` limits it to one item and everything it touches |
| `rainfall report [dir]` | tokens saved: digest versus reading the source |
| `rainfall components [--json]` | UI component shapes and their data contracts |
| `rainfall prompt` | AI instructions for building the manifest |

## What `condense` prints

```
RAINFALL v1.0 — mealcoach-example (nextjs, dynamodb, react-query)

## Entities (the ocean — source of truth)
E001 User{userId,email,goals:string[]} @ dynamodb:AppTable
E002 Meal{mealId,userId,name,score:number,createdAt:datetime} @ dynamodb:AppTable

## Endpoints (evaporation — data lifted from the ocean)
API-001 GET /api/score reads:User.goals,Meal.score returns:{overall:number} → C001
API-002 POST /api/meals writes:Meal returns:{mealId,score:number} → C002

## Components (rainfall — where data lands)
C001 ScoreCard components/ScoreCard.jsx ui:card.home.score apis:API-001
C002 MealLogger components/MealLogger.jsx ui:form.meal.log apis:API-002

## Flows (the cycle — end-to-end paths)
F001 log-meal: ui:form.meal.log → api:API-002 → entity:Meal → api:API-001 → ui:card.home.score

~215 tokens (manifest JSON itself: ~509 tokens)
```

Everything is referred to by a stable id — `E001`, `API-002`, `card.home.score` — so an
agent names things instead of re-deriving them.

---

## Component shapes — for any frontend, in any language

`rainfall components` lists every UI component type, what data it accepts, and what
props it produces:

```
Select    Choose one of many — select, dropdown, radio group, autocomplete
          in : Row[] — an array of records
          out: { items: { value, label }[] }
          opt: valueField, labelField

Table     Rows and columns — table, data grid, spreadsheet
          in : Row[] — columns are derived from the first row unless given
          out: { columns: { id, header }[], rows: Row[] }
          opt: columns, headers
```

Eleven shapes: `Select` `Table` `List` `Card` `Tabs` `Timeline` `Chart` `Stat`
`KeyValue` `Tree` `Form`.

**This is data, not code.** It lives in
[`schema/components.json`](schema/components.json), so a SwiftUI, Flutter, Blazor,
Django or Rails frontend can read the same contract and implement it natively —
`rainfall components --json` prints it. The JS implementations below are a
convenience for JS projects, not the point.

They are named after the **shape they produce**, never after a UI library. `Table` is a
shape; `MuiDataGrid` would be a dependency, and a promise this package cannot keep as
that library changes.

### If you are in JS

```js
import { useGenericMappings, mapProps } from '@morf_engineering/rainfalljs/mapper';

useGenericMappings();

mapProps('generic', 'Select', users, { valueField: 'id', labelField: 'name' });
// → { items: [{ value: '1', label: 'Ada' }, …] }
```

A mapping is a pure function — `(data, options) => props`. No React, no hooks, no DOM.
Register your own on top:

```js
import { defineMappings } from '@morf_engineering/rainfalljs/mapper';

defineMappings('acme', {
  Table: (data, { headers = {} }) => ({
    rows: data,
    columns: Object.keys(data[0] ?? {}).map((id) => ({ id, header: headers[id] ?? id })),
  }),
});
```

Registering twice merges, later wins per component, so you can adjust one mapping
without restating the rest. An unregistered mapping **throws** — returning raw data
instead gives you a blank panel and no error anywhere.

---

## The Data Map — the typed API

The same model, as a TypeScript module, when you want to query it in a test or a script
rather than print it:

```js
import { defineDataMap, validate, brief } from '@morf_engineering/rainfalljs';

const map = defineDataMap({
  name: 'Acme',
  requirements: [{ id: 'BR-1', statement: 'A customer sees their invoices.',
                   endpoints: ['INV'], screens: ['billing'], state: 'built' }],
  endpoints:    [{ id: 'INV', path: '/invoices', method: 'GET', state: 'built',
                   access: { mode: 'read', key: 'Query PK = TENANT#<tid>' } }],
  components:   [{ id: 'Table', name: 'Invoice table', state: 'built',
                   needs: [{ endpoint: 'INV', flow: 'FETCH' }] }],
  screens:      [{ id: 'billing', name: 'Billing', route: '/billing',
                   components: ['Table'], state: 'built' }],
});

map.consumersOf('INV');   // what breaks if I change this endpoint
map.trace('BR-1');        // requirement → endpoints → screens → components
map.subtreeOf('Page');    // a component and everything it renders
map.parentOf('Row');      // what renders this one
validate(map);            // dangling refs, render cycles and state conflicts are errors
brief(map);               // the digest
```

Components nest via `children`, so the map matches how a UI is actually built. A screen
names its top-level components; those name theirs. `endpointsFor(screen)` then resolves
an endpoint fetched four levels down without the screen restating it, and `brief` prints
the tree:

```
S1       /dash  Dashboard
         Page
           └ Panel
             └ Row  ←E2
         endpoints:  E2
```

It adds two layers the manifest does not yet carry: **business requirements** (what the
product must do, and what it refuses) and **access patterns** (the key expression and
index behind each endpoint) — so the map runs from a business statement all the way to
a DynamoDB key.

Full guide: **[docs/DATA-MAP.md](docs/DATA-MAP.md)**.

---

## Using it with an agent

Drop [`skills/rainfall-manifest/SKILL.md`](skills/rainfall-manifest/SKILL.md) into
`.claude/skills/rainfall-manifest/` and your agent will read, use and maintain the
manifest on its own.

Or have it build one for you:

```bash
npx @morf_engineering/rainfalljs prompt
```

Paste the output into Claude, Cursor, or any coding assistant. `scan` finds the
skeleton; entities, response shapes and flows need code understanding, which is the
agent's job.

Then in CI:

```yaml
- run: npx rainfall validate
```

That last line is the whole argument. An architecture doc that fails the build is a
different kind of object from one that does not.

See [`RECOMMENDATION.md`](RECOMMENDATION.md) for the rationale and
[`schema/rainfall.schema.json`](schema/rainfall.schema.json) for the manifest format.

---

## Upgrading from 0.2.x

**0.3.0 removes the React runtime.** `DataProvider`, `useData`, `withData`,
`NextDataProvider`, `withServerSideData` and `createApiRoute` are gone, along with the
React and Next peer dependencies and the babel build.

They were a Context-based data layer that `@tanstack/react-query` does better, and they
were never the reason to install this. Two devDependencies remain where there were
twenty; there are no runtime dependencies and no vulnerabilities.

If you were using them — and the root entry threw `MODULE_NOT_FOUND` on every 0.1.x
release, so this is unlikely — pin `0.2.0` or move to React Query.

The component mapper survives, rewritten without React: `/mapper`, pure functions,
described by a JSON catalogue any language can read.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — setup, layout, the testing rule, and how a
release is cut.

## License

MIT
