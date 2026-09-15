# RainfallJS

[![Tests](https://github.com/Morf-Engineering-Inc/rainfalljs/actions/workflows/test.yml/badge.svg)](https://github.com/Morf-Engineering-Inc/rainfalljs/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@morf_engineering/rainfalljs.svg)](https://www.npmjs.com/package/@morf_engineering/rainfalljs)
[![npm downloads](https://img.shields.io/npm/dm/@morf_engineering/rainfalljs.svg)](https://www.npmjs.com/package/@morf_engineering/rainfalljs)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/@morf_engineering/rainfalljs?activeTab=dependencies)
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

## About the name

Rain does not fall once. It cycles — and that is the part of the metaphor the
name is actually about.

Water leaves the ocean, gathers as cloud, falls where it is needed, runs back,
and leaves again. The ocean is never drained and the cloud is never a copy left
to go stale; the same water keeps moving, and the system stays in balance because
the return trip is part of it.

Knowledge about a codebase should move the same way. It is lifted out of the code
(`scan`), held in a compact form that is small enough to carry (`rainfall.json`),
rained onto the work exactly where it is needed and no more than needed
(`condense`), and returned — because the agent that changed the code updates the
map in the same breath, and `validate` fails the build if it ever forgets.

**The return trip is the whole design.** Documentation that only falls is a
one-way trip: written once, accurate for a month, quietly wrong forever after,
because nothing carries the knowledge back up. A cycle cannot drift, because
drift is a broken build.

So the name is not "data rains down onto your components." It is that the loop
closes. Ocean, cloud, rain, ground, and back to the ocean — and nothing
evaporates out of the system on the way.

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

## The worked demo — real numbers you can re-run

[`examples/fintech-demo/`](examples/fintech-demo/) is a complete Next.js finance app —
accounts, transactions, budgets, net worth, insights — with a `rainfall.json` describing
it. It exists so the token claim is a measurement rather than a promise.

[`TOKENS.md`](examples/fintech-demo/TOKENS.md) is the output of `rainfall report` against
those files, not an estimate:

```
Condensed digest:            ~726 tokens   (what an AI reads instead)
Mapped source files:         ~3631 tokens  (16 files the manifest describes)
All project source files:    ~3699 tokens  (17 files, blind-exploration ceiling)

Savings vs reading mapped files:   5.0x fewer tokens per session
Savings vs exploring the project:  5.1x fewer tokens per session
```

Scoped to one work item — everything an agent needs to change the add-transaction form
and nothing else:

```
~233 tokens focused on "form.transactions.add"   (full digest: ~726)
```

Roughly **16x** less than reading the project, for a task-sized context.

Re-run it yourself:

```bash
cd examples/fintech-demo
npx @morf_engineering/rainfalljs report
npx @morf_engineering/rainfalljs condense --focus form.transactions.add
```

[`GROK_PROMPT.md`](examples/fintech-demo/GROK_PROMPT.md) is the prompt used to test
whether an agent given only the digest can make a correct change — the part that decides
whether the saving is real or just smaller.

> **Read the numbers honestly.** They compare a digest against reading source files, on
> one small app. A larger codebase moves the ratio up, and a task that genuinely needs
> the source still needs the source. The digest tells an agent *where to look*; it does
> not replace looking.

---

## FAQ

### Does this work with frontends that aren't JavaScript?

**Yes — that is the design, not a workaround.** The two things this tool produces are
JSON files, not JavaScript:

- **`rainfall.json`** — your map. Entities, endpoints, components, screens, flows.
- **[`schema/components.json`](schema/components.json)** — the component-shape
  catalogue: what each UI component type accepts as data and what props it produces.

A SwiftUI, Flutter, Blazor, Django, Rails, Android or Unity frontend reads those the
same way anything reads JSON, and implements the shapes natively. `rainfall components
--json` prints the catalogue; `rainfall condense` prints the map. Neither output
contains a line of JavaScript.

The JS mapper (`/mapper`) is a convenience for projects that happen to be in JS. It is
one implementation of the catalogue, not the definition of it.

### So what actually requires Node?

Only the CLI itself — it ships on npm, so running `rainfall validate` or `condense`
needs Node on the machine or in CI. That is a build-time dependency, in the same way a
linter is. **Nothing at runtime, in any language**, and the artifacts it produces
outlive it: `rainfall.json` is a plain file you could hand-write and read with
`json.load`.

If you want the check in a non-Node CI, one step with `npx` covers it:

```yaml
- run: npx @morf_engineering/rainfalljs validate
```

### Will `rainfall scan` understand my Swift / Python / Go project?

**No — and this is the honest limit.** `scan` reads React and Next.js source to seed a
manifest. On any other stack it will find nothing useful.

That matters less than it sounds, because `scan` only ever produces the skeleton. The
parts worth having — entity fields, response shapes, which component needs which
endpoint, the flows — require understanding the code, which is why the recommended
path on *every* stack is:

```bash
npx @morf_engineering/rainfalljs prompt
```

and hand the output to an AI assistant, which reads your models and handlers and writes
the manifest. That works the same whether the code is TypeScript or Kotlin.

### Does my backend have to be JavaScript?

No. Endpoints are **declared**, not introspected. An entry like

```json
{ "id": "API-001", "method": "GET", "path": "/api/score", "reads": ["User.goals"] }
```

says nothing about what serves it — Django, Rails, Go, a Lambda, or a mainframe behind a
gateway. The Data Map's `access` field goes further and records the key expression
behind an endpoint, which is usually a database concern with no language at all.

### Isn't this just OpenAPI?

They answer different questions and compose well. OpenAPI describes **the API**: routes,
payloads, status codes. It does not say which screen calls a route, which component
breaks if a field is renamed, or which business requirement the route exists to serve.

This maps the consumers: requirement → endpoint → component → screen. Keep your OpenAPI
spec; point the manifest's endpoint ids at it.

### Is this only useful if I use AI?

No. The token saving is the headline because it is measurable, but `validate` earns its
place without an agent anywhere: it fails the build when a screen references an endpoint
nobody declares, when an endpoint has no consumer, or when a requirement has nothing
serving it. That is a stale-architecture-doc problem that has existed far longer than
coding assistants have.

### Do I have to use the component mapper?

No. The map and the mapper are independent. Plenty of projects will want
`rainfall.json` and `validate` in CI and nothing else.

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
