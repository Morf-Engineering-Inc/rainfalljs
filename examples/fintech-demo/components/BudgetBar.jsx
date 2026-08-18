import { money } from '../lib/format';

export default function BudgetBar({ budget }) {
  const pct = Math.min(100, Math.round((budget.spent / budget.monthlyLimit) * 100));
  const over = budget.spent > budget.monthlyLimit;
  return (
    <div className="budget-row" data-ui-id="bar.budgets.category">
      <div className="budget-head">
        <span className="budget-cat">{budget.category}</span>
        <span className={`budget-nums ${over ? 'neg' : ''}`}>
          {money(budget.spent)} / {money(budget.monthlyLimit)}
        </span>
      </div>
      <div className="bar-track">
        <div className={`bar-fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
