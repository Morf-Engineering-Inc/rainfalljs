# AI Build Test — With Rainfall

> Treatment group. Paste the prompt below to the AI, point it at this branch
> (`demo/fintech-rainfall`), and record total tokens used (input + output) from
> the provider's usage meter once the feature works. Compare against the same
> task run from `demo/fintech-baseline`'s GROK_PROMPT.md.

---

You are working on Fintrack, a Next.js personal finance app located in
`examples/fintech-demo` of this repository.

This project uses a **Rainfall manifest** (`rainfall.json`): a compact map of its
data layer. **Do not explore the codebase.** The digest below tells you every
entity, endpoint, component, and flow, and which file each lives in — open only
the files you are actually changing. Refer to items by their ids (C001, API-003,
form.transactions.add).

## Project digest (from `npx rainfall condense`)

```
RAINFALL v1.0 — fintrack (nextjs, react, in-memory-db)

## Entities (the ocean — source of truth)
E001 Account{accountId,name,type:checking|savings|credit|investment,balance:number,currency} @ memory:lib/db.js
E002 Transaction{txId,accountId,date:YYYY-MM-DD,merchant,category:groceries|dining|travel|transport|subscriptions|income|savings,amount:number (negative = spend)} @ memory:lib/db.js
E003 Budget{budgetId,category,monthlyLimit:number,month:YYYY-MM} @ memory:lib/db.js
E004 NetWorthPoint{month,total:number} @ memory:lib/db.js

## Endpoints (evaporation — data lifted from the ocean)
API-001 GET /api/accounts reads:Account returns:{accounts:Account[],netWorth:number} → C001,C002
API-002 GET /api/transactions reads:Transaction returns:{transactions:Transaction[],count:number} → C001,C002
API-003 POST /api/transactions reads:Account writes:Transaction,Account returns:{transaction:Transaction} → C008
API-004 GET /api/networth reads:NetWorthPoint returns:{history:NetWorthPoint[],latest:number,changePct:number} → C001,C006
API-005 GET /api/insights reads:Transaction,Budget returns:{topCategory:{category,amount},overBudget:string[],savingsRate:number} → C001,C010
API-006 GET /api/budgets reads:Budget,Transaction returns:{budgets:Budget[] (+spent:number)} → C003,C009
API-007 GET /api/accounts/{id} reads:Account,Transaction returns:{account:Account,transactions:Transaction[]}

## Components (rainfall — where data lands)
C001 Dashboard pages/index.js ui:screen.dashboard.main apis:API-001,API-002,API-004,API-005
C002 TransactionsPage pages/transactions.js ui:screen.transactions.main apis:API-001,API-002
C003 BudgetsPage pages/budgets.js ui:screen.budgets.main apis:API-006
C004 Header components/Header.jsx ui:nav.header.main
C005 AccountCard components/AccountCard.jsx ui:card.dashboard.account
C006 NetWorthChart components/NetWorthChart.jsx ui:chart.dashboard.networth apis:API-004
C007 TransactionTable components/TransactionTable.jsx ui:table.transactions.list
C008 TransactionForm components/TransactionForm.jsx ui:form.transactions.add apis:API-003
C009 BudgetBar components/BudgetBar.jsx ui:bar.budgets.category
C010 InsightCard components/InsightCard.jsx ui:card.dashboard.insights

## Flows (the cycle — end-to-end paths)
F001 view-dashboard: ui:screen.dashboard.main → api:API-001 → entity:Account → api:API-004 → ui:chart.dashboard.networth
F002 add-transaction: ui:form.transactions.add → api:API-003 → entity:Transaction → entity:Account → api:API-002 → ui:table.transactions.list
F003 filter-transactions: ui:screen.transactions.main → api:API-002 → entity:Transaction
F004 track-budgets: ui:screen.budgets.main → api:API-006 → entity:Budget → entity:Transaction → ui:bar.budgets.category
F005 read-insights: ui:card.dashboard.insights → api:API-005 → entity:Transaction → entity:Budget
```

Useful facts from the digest: entities live in `lib/db.js`; API handlers follow
the pattern in `pages/api/budgets.js`; the dashboard (C001) fetches with plain
`fetch` in `useEffect`; components carry `data-ui-id` attributes matching their
uiId; conventions for a panel with bars are in C009 (`bar.budgets.category`).

## Task: Savings Goals

1. **Data**: add a `Goal` entity to `lib/db.js`: `goalId`, `name`,
   `targetAmount`, `savedAmount`, `deadline` (YYYY-MM-DD). Seed 2 example goals.
2. **API**: add `GET /api/goals` returning all goals each with a computed
   `progressPct`, and `POST /api/goals` to create a goal (validate that `name`
   and `targetAmount` are present; `targetAmount` must be a positive number).
3. **UI**: add a Goals panel to the dashboard (C001) showing each goal as a
   progress bar with the percentage and the amount remaining, plus a small form
   to add a new goal. Match the app's existing visual style and conventions.
4. Everything must work end-to-end in the running app (`npm run dev`).

## When you're done

Update `rainfall.json` in the same change: add entity `E005 Goal`, endpoints
`API-008` (GET /api/goals) and `API-009` (POST /api/goals), the new components
with uiIds following the `<element>.<screen>.<purpose>` convention (e.g.
`panel.dashboard.goals`, `form.dashboard.addGoal`), and a flow
`F006 track-goals`. If the CLI is available, verify with
`npm run rainfall validate`.
