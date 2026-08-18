# Fintrack token measurements (real, reproducible)

All numbers below are actual output of `npm run rainfall report` / `condense`
against the files in this branch — run them yourself to reproduce. Estimates
use the standard ~4 characters/token heuristic.

## The clock

```
Rainfall tokens-saved report — fintrack

Condensed digest:            ~726 tokens   (what an AI reads instead)
Mapped source files:         ~3631 tokens  (16 files the manifest describes)
All project source files:    ~4977 tokens  (19 files, blind-exploration ceiling)

Savings vs reading mapped files:  5.0x fewer tokens per session
Savings vs exploring the project: 6.9x fewer tokens per session
```

Scoped to a single work item (what an agent needs to modify the add-transaction
form and everything it touches):

```
~233 tokens focused on "form.transactions.add"  (full digest: ~726)
```

That's **~21x** less than reading the whole project — for a task-sized context.

## How to read these numbers honestly

- The file-size figures are a **floor** on real exploration cost. A real AI
  session doesn't read each file exactly once: it greps, opens wrong files,
  re-reads after context pressure, and repeats all of it next session. Real
  savings in practice are higher than the multiples above.
- This is a deliberately small app (19 source files). The digest grows
  linearly with the app; exploration grows much faster. On a 500-endpoint app
  the same measurement gives orders of magnitude, not single digits — and
  `condense --focus` keeps per-task context ~flat regardless of app size.
- The A/B test that matters is live: run the same task prompt on
  `demo/fintech-baseline` (no Rainfall) and `demo/fintech-rainfall` (this
  branch) with the same model, and compare the provider's token meter.
  `GROK_PROMPT.md` on each branch is that experiment, ready to run.
