# Fintrack — Rainfall demo app

A personal finance dashboard (accounts, transactions, budgets, net worth, insights)
used to demonstrate [Rainfall](../../README.md) on a realistic app.

## Run it

```bash
npm install
npm run dev   # http://localhost:3000
```

## The demo branches

- **`demo/fintech-baseline`** — this app, no Rainfall. Control group for AI-build tests.
- **`demo/fintech-rainfall`** — same app plus `rainfall.json`, the agent skill, measured
  token numbers (`TOKENS.md`), and an AI task prompt that uses the manifest.

Both branches contain `GROK_PROMPT.md` with the **same feature task** — give each
branch's prompt to an AI (Grok, Claude, Cursor, …) and compare how many tokens each
run burns before the feature works. That difference is Rainfall's value, measured.

## Rainfall CLI (self-installed from this repo — no npm publish needed)

```bash
npm run rainfall validate
npm run rainfall condense
npm run rainfall condense -- --focus card.dashboard.account
npm run rainfall report
```
