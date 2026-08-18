import { useEffect, useState } from 'react';
import BudgetBar from '../components/BudgetBar';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState(null);

  useEffect(() => {
    fetch('/api/budgets').then((r) => r.json()).then((d) => setBudgets(d.budgets));
  }, []);

  return (
    <div className="page" data-ui-id="screen.budgets.main">
      <h1>Budgets</h1>
      <div className="card">
        {(budgets || []).map((b) => (
          <BudgetBar key={b.budgetId} budget={b} />
        ))}
        {budgets && !budgets.length && <div className="empty">No budgets configured.</div>}
      </div>
    </div>
  );
}
