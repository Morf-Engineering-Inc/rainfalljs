# The Data Map

One declaration of how data flows from a business requirement, through the endpoint
and the key that serves it, to the screen a person uses.

```
requirement   what the business needs to be true
     │ serves
endpoint      what the server answers, and the key expression behind it
     │ needs
component     what renders it
     │ holds
screen        where a person meets it
```

It is plain data — no server, no build, no browser, no React. So a test, a CI job, a
docs generator or an AI agent can load the shape of a system without reading the
system.

```bash
npm install @morf_engineering/rainfalljs
```

```js
import { defineDataMap, validate, brief } from "@morf_engineering/rainfalljs/datamap";
```

The runtime half of RainfallJS (`DataProvider`, `useData`) is separate and optional.
A map describes a system; it does not have to be the system that fetches.

---

## Why it exists

Three problems, one file.

**1. Nobody can answer "what breaks if I change this key."** The answer lives in a
Terraform comment, a handler, a hook and a component, and assembling it takes an
afternoon. `map.consumersOf("R12")` takes no time and is checked by CI.

**2. The spec, the API and the UI drift.** Business requirements live in a doc, the
access patterns in the infrastructure, the screens in a register — three lists that
agree on the day they are written and never again. One map with ids as the only shared
column cannot half-drift: a dangling reference is an error, not a stale sentence.

**3. An agent asked to change an endpoint reads the whole repo to find out what
depends on it.** That is the expensive part of AI-assisted work and most of it is
rediscovery. `brief(map)` prints the entire data flow — requirement, key expression,
index, component, screen — in a form built for a context window.

On the worked example below: **113 KB of source documents and registers → a 14 KB
brief.** Roughly 28,000 tokens down to 3,500, and it is current because the build
fails when it is not.

---

## Declaring a map

Four flat arrays. Ids are yours; they are the only thing the layers share.

```js
import { defineDataMap } from "@morf_engineering/rainfalljs/datamap";

export const map = defineDataMap({
  name: "Acme",
  version: "2.1.0",

  requirements: [
    {
      id: "BR-101",
      statement: "A customer can see every invoice they have been sent.",
      actor: "customer",
      endpoints: ["INV-LIST"],
      screens: ["billing"],
      refuses: "another tenant's invoices — 404, never 403",
      state: "built",
    },
  ],

  endpoints: [
    {
      id: "INV-LIST",
      path: "/invoices",
      method: "GET",
      summary: "The caller's invoices, newest first",
      access: {
        mode: "read",
        key: 'Query PK = TENANT#<tid>, begins_with(SK, "INV#")',
        index: "base",
        notes: "SK carries the issue date, so newest-first is free",
      },
      state: "built",
    },
  ],

  components: [
    {
      id: "InvoiceTable",
      name: "Invoice table",
      file: "src/billing/InvoiceTable.tsx",
      needs: [{ endpoint: "INV-LIST", flow: "FETCH", required: true }],
      state: "built",
    },
  ],

  screens: [
    {
      id: "billing",
      name: "Billing",
      route: "/billing",
      components: ["InvoiceTable"],
      loading: "parallel",
      cache: "moderate",
      state: "built",
    },
  ],
});
```

### `state` is four words, not a percentage

`built` · `partial` (works, a piece is missing or local-only) · `planned` (declared,
nothing behind it) · `fenced` (deliberately not built, named so it is not mistaken for
an oversight).

A percentage invites a number nobody can falsify. Four words can each be checked
against the code, and `validate` enforces the ones that cannot both be true — a
`built` requirement resting on a `planned` endpoint is an error.

### A screen has no endpoint list

Deliberately. `map.endpointsFor("billing")` computes it from the components. A
hand-kept copy would be a second list, and a second list drifts from the first in
exactly the way this map exists to prevent. Screens may declare `extraEndpoints` for
what the page itself fetches outside any component — most need none.

---

## Asking it questions

```js
map.endpointsFor("billing")      // every endpoint this screen reaches
map.componentsFor("billing")     // what it holds
map.consumersOf("INV-LIST")      // what breaks if I change this endpoint
map.screensUsing("INV-LIST")     // where a user would notice
map.requirementsFor("INV-LIST")  // who asked for it
map.trace("BR-101")              // the whole chain under one requirement
```

`trace` returns the endpoints, the screens, and the components that actually carry the
requirement — a component on the screen that needs nothing from it is chrome, and is
left out. It also returns `missingEndpoints` and `missingScreens`, so a broken chain
reports rather than throws.

**Nothing throws on a bad reference.** An unknown id is a finding. The map has to stay
loadable precisely when it is wrong, or you cannot use it to find out what is wrong.

---

## Validating

```js
import { validate, isValid, findings } from "@morf_engineering/rainfalljs/datamap";

const list = validate(map);
console.log(findings(list));
process.exit(isValid(list) ? 0 : 1);
```

Two levels, and the distinction is the design:

| Level | Means | Example |
|---|---|---|
| **error** | the map contradicts **itself** | dangling reference, duplicate id, a `built` thing resting on a `planned` one |
| **warn** | the map is honest and the **product** has a hole | an endpoint nobody calls, a requirement nothing serves |

`isValid` is false only on errors. Warnings are meant to be read, argued with, and
sometimes kept — a `planned` endpoint is not reported as an orphan, because being
unbuilt is why it is there.

Every finding carries a stable `code`, so a test can name one:

`duplicate-id` · `unknown-endpoint` · `unknown-component` · `unknown-screen` ·
`orphan-endpoint` · `orphan-component` · `unserved-requirement` ·
`unplaced-requirement` · `unrequired-endpoint` · `missing-fallback` ·
`state-conflict` · `context-cycle`

Two worth explaining:

- **`unserved-requirement`** — a requirement naming no endpoint. A feature with no
  server behind it. The complement, `unrequired-endpoint`, is a row nobody asked for.
  Between them they catch the two ways a spec and an API come apart.
- **`missing-fallback`** — a need marked `required: false` with no `fallback`.
  "Optional" that was never rendered without the data is optional in a comment only.

---

## Reporting

```js
import { brief, markdown, mermaid } from "@morf_engineering/rainfalljs/datamap";

brief(map)               // the dense map, for a context window
markdown(map)            // tables, for a doc or a PR
mermaid(map, "billing")  // one screen's graph; omit the id for all of them
```

`brief` is the one that pays for the map. Every line is one fact, nothing is repeated
between sections, and the legend is printed inside the output so a pasted map explains
itself. Endpoints carry their key expression and index; an endpoint nothing consumes
is marked `used by: NOBODY`.

---

## Worked example: RecordsBug

RecordsBug is a genealogical research product with a 43-noun controlled vocabulary, a
52-surface register, business requirements in `BR-v1.md` and access patterns in
`AP-v1.md`. Its map is ~200 lines and **reads the surface register rather than
retyping it** — only the endpoints and the requirements are declared, because those
are the two things the register does not carry.

That is the pattern to copy. A map you retype is a third list. A map that reads the
register drifts only when the register does.

It found things the prose did not:

- **`/records` was overstated.** The route is 11 built panels, 1 partial and 7 that
  render invented data. Calling it "built" was flattering; `state-conflict` said so.
- **The core noun has no registered screen.** `research_question` is ruled the root of
  the data model. `/questions` has a route and an API client — and zero rows in the
  surface register, so `GET /questions` reported as an endpoint nobody consumes. Three
  documents and a register report generator had all missed it.
- **Four more orphans**: the team share pointer, the claim write, and the question
  read and write — each declared, each consumed by no registered surface.

None of these were invented. They are what a map notices and a paragraph does not.

---

## Using it with an agent

Put the brief where the agent will see it, and regenerate it in CI:

```json
{
  "scripts": {
    "datamap": "node datamap/index.mjs",
    "datamap:check": "node datamap/index.mjs --check"
  }
}
```

Then `npm run datamap > CONTEXT.md`, and point your agent instructions at it. The
value is not that the file is short. It is that the file is short **and** the build
fails when it stops being true, which is the property a hand-written architecture doc
has never had.
