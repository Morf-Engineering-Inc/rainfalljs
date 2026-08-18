// The AI bootstrap prompt: paste-ready instructions that turn any AI coding
// assistant into a manifest author. Printed by `rainfall prompt` so users
// whose agent doesn't have the rainfall-manifest skill installed can still
// have their AI build and maintain the manifest.

const BOOTSTRAP_PROMPT = `You are helping me create and maintain a Rainfall manifest (rainfall.json) for this project. A Rainfall manifest is a compact map of the app's data layer, so AI sessions can read a few hundred tokens instead of re-reading the codebase.

## Step 1 — Seed it mechanically

Run these and use their output as the starting skeleton (or, if the CLI is unavailable, create rainfall.json by hand following the format below):

    npx @morf_engineering/rainfalljs init
    npx @morf_engineering/rainfalljs scan

The scan is heuristic: it finds components, API routes, and fetch calls, but it guesses. Prune anything that isn't a real screen component or endpoint (helpers, tests, config).

## Step 2 — Add what the scan can't know (this is your real job)

1. ENTITIES: find the data models (database schemas, ORM models, TypeScript types for stored records). For each, add an entity with a stable id (E001, E002, ...), its name, source (e.g. "dynamodb:AppTable", "postgres:users"), and a fields map with types; mark required fields.
2. ENDPOINTS: open each endpoint's handler and fill in method (scan defaults everything to GET — fix POST/PUT/DELETE), reads (entities/fields it queries), writes (entities it mutates), and returns (the response shape as a field map).
3. COMPONENTS: give every component a uiId using the convention <element>.<screen>.<purpose>[.variant] — e.g. button.login.main, card.home.score, form.meal.log. Reuse existing testID values where they exist.
4. FLOWS: add 3-8 flows for the main user journeys, as ordered steps of typed refs: "ui:<uiId>", "api:<id>", "entity:<name>". Example: ["ui:form.meal.log", "api:API-002", "entity:Meal", "api:API-001", "ui:card.home.score"].

Rules: ids are permanent — continue existing sequences, never renumber. If the codebase and manifest disagree, the code is right: fix the manifest.

## Step 3 — Verify

    npx @morf_engineering/rainfalljs validate   # must pass with no errors; fix warnings
    npx @morf_engineering/rainfalljs report     # show me the tokens-saved numbers

## Step 4 — Keep it true (standing instruction)

From now on in this project, whenever you add or change an entity, endpoint, or data-consuming component, update rainfall.json in the same change and re-run validate. Prefer reading the manifest over re-exploring the codebase, and refer to things by their manifest ids.

## Manifest format reference

{
  "rainfall": "1.0",
  "project": { "name": "...", "description": "...", "stack": ["nextjs"] },
  "entities": [{ "id": "E001", "name": "User", "source": "postgres:users",
                 "fields": { "userId": { "type": "string", "required": true }, "goals": "string[]" } }],
  "endpoints": [{ "id": "API-001", "method": "GET", "path": "/api/score", "file": "pages/api/score.js",
                  "reads": ["User.goals"], "writes": [], "returns": { "overall": "number" },
                  "components": ["C001"] }],
  "components": [{ "id": "C001", "name": "ScoreCard", "file": "components/ScoreCard.jsx",
                   "uiId": "card.home.score", "apis": ["API-001"] }],
  "flows": [{ "id": "F001", "name": "log-meal",
              "steps": ["ui:form.meal.log", "api:API-002", "entity:Meal"] }]
}

Start with Step 1 now and show me the manifest when validate passes.`;

module.exports = { BOOTSTRAP_PROMPT };
