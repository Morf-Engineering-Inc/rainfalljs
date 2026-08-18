# AI Build Test — Baseline (no Rainfall)

> Control group. Paste the prompt below to the AI, point it at this branch
> (`demo/fintech-baseline`), and record total tokens used (input + output) from
> the provider's usage meter once the feature works.

---

You are working on Fintrack, a Next.js personal finance app located in
`examples/fintech-demo` of this repository. Explore the codebase as needed to
understand its structure, then implement the following feature:

## Task: Savings Goals

1. **Data**: add a `Goal` model to the app's data layer: `goalId`, `name`,
   `targetAmount`, `savedAmount`, `deadline` (YYYY-MM-DD). Seed 2 example goals.
2. **API**: add `GET /api/goals` returning all goals each with a computed
   `progressPct`, and `POST /api/goals` to create a goal (validate that `name`
   and `targetAmount` are present; `targetAmount` must be a positive number).
3. **UI**: add a Goals panel to the dashboard showing each goal as a progress
   bar with the percentage and the amount remaining, plus a small form to add
   a new goal. Match the app's existing visual style and conventions.
4. Everything must work end-to-end in the running app (`npm run dev`).
